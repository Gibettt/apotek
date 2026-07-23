package migrations

var Migration012ExtendBiayaOperasional = `
ALTER TABLE biaya_operasional
  ADD COLUMN IF NOT EXISTS dibatalkan_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dibatalkan_oleh UUID REFERENCES pengguna(id);

CREATE INDEX IF NOT EXISTS biaya_operasional_tanggal_idx ON biaya_operasional (tanggal);
CREATE INDEX IF NOT EXISTS biaya_operasional_akun_idx ON biaya_operasional (akun_id);

-- Counter penomoran biaya per periode (YYYYMM), terpisah dari penomoran_jurnal.
CREATE TABLE IF NOT EXISTS penomoran_biaya (
  periode CHAR(6) PRIMARY KEY,
  counter INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_nomor_biaya(p_tanggal DATE)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_periode CHAR(6) := to_char(p_tanggal, 'YYYYMM');
  v_counter INTEGER;
BEGIN
  INSERT INTO penomoran_biaya (periode, counter)
  VALUES (v_periode, 1)
  ON CONFLICT (periode) DO UPDATE SET counter = penomoran_biaya.counter + 1
  RETURNING counter INTO v_counter;

  RETURN 'BOP-' || v_periode || '-' || lpad(v_counter::text, 4, '0');
END;
$$;

-- Mencatat biaya operasional + otomatis membuat jurnal umum yang terhubung
-- (Debit akun beban terkait, Kredit Kas/Bank sesuai metode_bayar), atomik dalam satu transaksi.
CREATE OR REPLACE FUNCTION create_biaya_operasional(
  p_tanggal DATE,
  p_akun_id UUID,
  p_nama_biaya VARCHAR,
  p_jumlah NUMERIC,
  p_metode_bayar VARCHAR,
  p_catatan TEXT,
  p_cabang_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pengguna_id UUID;
  v_role VARCHAR;
  v_akun_tipe VARCHAR;
  v_akun_aktif BOOLEAN;
  v_kredit_kode VARCHAR;
  v_kredit_akun_id UUID;
  v_nomor VARCHAR;
  v_biaya_id UUID;
BEGIN
  SELECT pengguna_id, role_kode INTO v_pengguna_id, v_role FROM current_pengguna_role();
  IF v_pengguna_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak terdaftar atau belum masuk';
  END IF;
  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Hanya admin atau pemilik yang dapat mencatat biaya operasional';
  END IF;

  IF p_jumlah IS NULL OR p_jumlah <= 0 THEN
    RAISE EXCEPTION 'Jumlah biaya harus lebih besar dari nol';
  END IF;

  IF p_nama_biaya IS NULL OR btrim(p_nama_biaya) = '' THEN
    RAISE EXCEPTION 'Nama biaya wajib diisi';
  END IF;

  SELECT tipe, aktif INTO v_akun_tipe, v_akun_aktif FROM akun WHERE id = p_akun_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Akun beban tidak ditemukan';
  END IF;
  IF v_akun_tipe <> 'Beban' THEN
    RAISE EXCEPTION 'Akun yang dipilih bukan akun beban';
  END IF;
  IF NOT v_akun_aktif THEN
    RAISE EXCEPTION 'Akun beban yang dipilih sudah tidak aktif';
  END IF;

  v_kredit_kode := CASE WHEN p_metode_bayar = 'transfer' THEN '1102' ELSE '1101' END;

  SELECT id INTO v_kredit_akun_id FROM akun WHERE kode = v_kredit_kode AND aktif = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Akun kas/bank (kode %) tidak ditemukan atau tidak aktif', v_kredit_kode;
  END IF;

  v_nomor := next_nomor_biaya(p_tanggal);

  INSERT INTO biaya_operasional (
    cabang_id, akun_id, nomor, tanggal, nama_biaya, jumlah, metode_bayar, catatan, dibuat_oleh
  ) VALUES (
    p_cabang_id, p_akun_id, v_nomor, p_tanggal, p_nama_biaya, p_jumlah,
    COALESCE(NULLIF(p_metode_bayar, ''), 'tunai'), NULLIF(p_catatan, ''), v_pengguna_id
  ) RETURNING id INTO v_biaya_id;

  PERFORM create_jurnal_umum(
    p_tanggal,
    v_nomor,
    'Biaya operasional: ' || p_nama_biaya,
    'diposting',
    p_cabang_id,
    'biaya',
    'biaya_operasional',
    v_biaya_id,
    jsonb_build_array(
      jsonb_build_object('akunId', p_akun_id, 'debit', p_jumlah, 'kredit', 0, 'keterangan', p_nama_biaya),
      jsonb_build_object('akunId', v_kredit_akun_id, 'debit', 0, 'kredit', p_jumlah, 'keterangan', p_nama_biaya)
    )
  );

  RETURN v_biaya_id;
END;
$$;

-- Membatalkan biaya operasional lewat jurnal pembalik pada jurnal yang terhubung (bukan hapus baris).
CREATE OR REPLACE FUNCTION void_biaya_operasional(p_id UUID, p_alasan TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pengguna_id UUID;
  v_role VARCHAR;
  v_biaya biaya_operasional%ROWTYPE;
  v_jurnal_id UUID;
BEGIN
  SELECT pengguna_id, role_kode INTO v_pengguna_id, v_role FROM current_pengguna_role();
  IF v_pengguna_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak terdaftar atau belum masuk';
  END IF;
  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Hanya admin atau pemilik yang dapat membatalkan biaya operasional';
  END IF;

  SELECT * INTO v_biaya FROM biaya_operasional WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Biaya operasional tidak ditemukan';
  END IF;
  IF v_biaya.dibatalkan_at IS NOT NULL THEN
    RAISE EXCEPTION 'Biaya operasional ini sudah dibatalkan sebelumnya';
  END IF;

  SELECT id INTO v_jurnal_id FROM jurnal_umum
  WHERE sumber_tabel = 'biaya_operasional' AND sumber_id = p_id
  LIMIT 1;

  IF v_jurnal_id IS NOT NULL THEN
    PERFORM reverse_jurnal_umum(v_jurnal_id, p_alasan);
  END IF;

  UPDATE biaya_operasional
  SET dibatalkan_at = NOW(), dibatalkan_oleh = v_pengguna_id
  WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION create_biaya_operasional(DATE, UUID, VARCHAR, NUMERIC, VARCHAR, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_biaya_operasional(DATE, UUID, VARCHAR, NUMERIC, VARCHAR, TEXT, UUID) TO authenticated;

REVOKE ALL ON FUNCTION void_biaya_operasional(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION void_biaya_operasional(UUID, TEXT) TO authenticated;

-- Paksa seluruh tulis/hapus biaya_operasional lewat fungsi di atas, seperti pola jurnal_umum.
ALTER TABLE biaya_operasional ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS biaya_operasional_select ON biaya_operasional;
CREATE POLICY biaya_operasional_select ON biaya_operasional FOR SELECT TO authenticated USING (true);
`
