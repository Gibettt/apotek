package migrations

var Migration011ExtendJurnalUmum = `
ALTER TABLE jurnal_umum
  ADD COLUMN IF NOT EXISTS nomor_referensi VARCHAR(255),
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES pengguna(id);

CREATE UNIQUE INDEX IF NOT EXISTS jurnal_umum_sumber_unique
  ON jurnal_umum (sumber_tabel, sumber_id)
  WHERE sumber_tabel IS NOT NULL AND sumber_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS jurnal_umum_tanggal_idx ON jurnal_umum (tanggal);
CREATE INDEX IF NOT EXISTS jurnal_umum_status_idx ON jurnal_umum (status);
CREATE INDEX IF NOT EXISTS jurnal_umum_detail_jurnal_idx ON jurnal_umum_detail (jurnal_umum_id);

-- Counter penomoran jurnal per periode (YYYYMM), naik otomatis dan aman dari race condition.
CREATE TABLE IF NOT EXISTS penomoran_jurnal (
  periode CHAR(6) PRIMARY KEY,
  counter INTEGER NOT NULL DEFAULT 0
);

-- Resolve pengguna + kode role dari sesi Supabase Auth yang sedang login.
CREATE OR REPLACE FUNCTION current_pengguna_role()
RETURNS TABLE(pengguna_id UUID, role_kode VARCHAR)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pengguna.id, role.kode
  FROM pengguna
  JOIN role ON role.id = pengguna.role_id
  WHERE pengguna.auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION next_nomor_jurnal(p_tanggal DATE)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_periode CHAR(6) := to_char(p_tanggal, 'YYYYMM');
  v_counter INTEGER;
BEGIN
  INSERT INTO penomoran_jurnal (periode, counter)
  VALUES (v_periode, 1)
  ON CONFLICT (periode) DO UPDATE SET counter = penomoran_jurnal.counter + 1
  RETURNING counter INTO v_counter;

  RETURN 'JU-' || v_periode || '-' || lpad(v_counter::text, 4, '0');
END;
$$;

-- Validasi baris akun jurnal (dipakai saat create/update draft). Mengembalikan total debit & kredit.
CREATE OR REPLACE FUNCTION validate_jurnal_lines(p_details JSONB, p_require_balanced BOOLEAN)
RETURNS TABLE(total_debit NUMERIC, total_kredit NUMERIC)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_debit NUMERIC;
  v_kredit NUMERIC;
  v_akun_id UUID;
  v_aktif BOOLEAN;
  v_total_debit NUMERIC := 0;
  v_total_kredit NUMERIC := 0;
  v_count INTEGER := 0;
BEGIN
  IF p_details IS NULL OR jsonb_array_length(p_details) < 2 THEN
    RAISE EXCEPTION 'Jurnal minimal harus mempunyai dua baris akun';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_details)
  LOOP
    v_count := v_count + 1;
    v_akun_id := (v_item->>'akunId')::UUID;
    v_debit := COALESCE((v_item->>'debit')::NUMERIC, 0);
    v_kredit := COALESCE((v_item->>'kredit')::NUMERIC, 0);

    IF v_debit < 0 OR v_kredit < 0 THEN
      RAISE EXCEPTION 'Nilai debit dan kredit tidak boleh negatif';
    END IF;

    IF v_debit > 0 AND v_kredit > 0 THEN
      RAISE EXCEPTION 'Baris % hanya boleh mengisi debit atau kredit, tidak keduanya', v_count;
    END IF;

    IF v_debit = 0 AND v_kredit = 0 THEN
      RAISE EXCEPTION 'Baris % wajib mengisi debit atau kredit', v_count;
    END IF;

    SELECT aktif INTO v_aktif FROM akun WHERE id = v_akun_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Akun pada baris % tidak ditemukan', v_count;
    END IF;
    IF NOT v_aktif THEN
      RAISE EXCEPTION 'Akun pada baris % sudah tidak aktif', v_count;
    END IF;

    v_total_debit := v_total_debit + v_debit;
    v_total_kredit := v_total_kredit + v_kredit;
  END LOOP;

  IF v_total_debit <= 0 THEN
    RAISE EXCEPTION 'Total transaksi jurnal harus lebih besar dari nol';
  END IF;

  IF p_require_balanced AND v_total_debit <> v_total_kredit THEN
    RAISE EXCEPTION 'Jurnal belum seimbang, total debit dan kredit harus sama untuk diposting';
  END IF;

  RETURN QUERY SELECT v_total_debit, v_total_kredit;
END;
$$;

-- Membuat jurnal umum (header + detail) secara atomik, termasuk penomoran otomatis.
CREATE OR REPLACE FUNCTION create_jurnal_umum(
  p_tanggal DATE,
  p_nomor_referensi VARCHAR,
  p_deskripsi TEXT,
  p_status VARCHAR,
  p_cabang_id UUID,
  p_sumber VARCHAR,
  p_sumber_tabel VARCHAR,
  p_sumber_id UUID,
  p_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pengguna_id UUID;
  v_role VARCHAR;
  v_status VARCHAR := COALESCE(NULLIF(p_status, ''), 'draft');
  v_nomor VARCHAR;
  v_jurnal_id UUID;
  v_item JSONB;
BEGIN
  SELECT pengguna_id, role_kode INTO v_pengguna_id, v_role FROM current_pengguna_role();
  IF v_pengguna_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak terdaftar atau belum masuk';
  END IF;
  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Hanya admin atau pemilik yang dapat membuat jurnal';
  END IF;

  IF v_status NOT IN ('draft', 'diposting') THEN
    RAISE EXCEPTION 'Status awal jurnal hanya boleh draft atau diposting';
  END IF;

  PERFORM * FROM validate_jurnal_lines(p_details, v_status = 'diposting');

  v_nomor := next_nomor_jurnal(p_tanggal);

  INSERT INTO jurnal_umum (
    cabang_id, nomor, tanggal, nomor_referensi, sumber, sumber_tabel, sumber_id,
    deskripsi, status, dibuat_oleh, posted_at, posted_by
  ) VALUES (
    p_cabang_id, v_nomor, p_tanggal, NULLIF(p_nomor_referensi, ''),
    COALESCE(NULLIF(p_sumber, ''), 'manual'), p_sumber_tabel, p_sumber_id,
    p_deskripsi, v_status, v_pengguna_id,
    CASE WHEN v_status = 'diposting' THEN NOW() ELSE NULL END,
    CASE WHEN v_status = 'diposting' THEN v_pengguna_id ELSE NULL END
  ) RETURNING id INTO v_jurnal_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_details)
  LOOP
    INSERT INTO jurnal_umum_detail (jurnal_umum_id, akun_id, debit, kredit, keterangan)
    VALUES (
      v_jurnal_id,
      (v_item->>'akunId')::UUID,
      COALESCE((v_item->>'debit')::NUMERIC, 0),
      COALESCE((v_item->>'kredit')::NUMERIC, 0),
      NULLIF(v_item->>'keterangan', '')
    );
  END LOOP;

  RETURN v_jurnal_id;
END;
$$;

-- Mengubah jurnal yang MASIH DRAFT (header + replace seluruh detail).
CREATE OR REPLACE FUNCTION update_jurnal_umum_draft(
  p_id UUID,
  p_tanggal DATE,
  p_nomor_referensi VARCHAR,
  p_deskripsi TEXT,
  p_details JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pengguna_id UUID;
  v_role VARCHAR;
  v_status VARCHAR;
BEGIN
  SELECT pengguna_id, role_kode INTO v_pengguna_id, v_role FROM current_pengguna_role();
  IF v_pengguna_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak terdaftar atau belum masuk';
  END IF;
  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Hanya admin atau pemilik yang dapat mengubah jurnal';
  END IF;

  SELECT status INTO v_status FROM jurnal_umum WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jurnal tidak ditemukan';
  END IF;
  IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'Jurnal berstatus diposting tidak boleh diedit langsung, gunakan pembatalan/jurnal pembalik';
  END IF;

  PERFORM * FROM validate_jurnal_lines(p_details, FALSE);

  UPDATE jurnal_umum
  SET tanggal = p_tanggal,
      nomor_referensi = NULLIF(p_nomor_referensi, ''),
      deskripsi = p_deskripsi,
      updated_at = NOW()
  WHERE id = p_id;

  DELETE FROM jurnal_umum_detail WHERE jurnal_umum_id = p_id;

  INSERT INTO jurnal_umum_detail (jurnal_umum_id, akun_id, debit, kredit, keterangan)
  SELECT
    p_id,
    (item->>'akunId')::UUID,
    COALESCE((item->>'debit')::NUMERIC, 0),
    COALESCE((item->>'kredit')::NUMERIC, 0),
    NULLIF(item->>'keterangan', '')
  FROM jsonb_array_elements(p_details) AS item;
END;
$$;

-- Memposting jurnal draft: validasi ulang saldo & status akun, lalu kunci status jadi diposting.
CREATE OR REPLACE FUNCTION post_jurnal_umum(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pengguna_id UUID;
  v_role VARCHAR;
  v_status VARCHAR;
  v_total_debit NUMERIC;
  v_total_kredit NUMERIC;
  v_count INTEGER;
BEGIN
  SELECT pengguna_id, role_kode INTO v_pengguna_id, v_role FROM current_pengguna_role();
  IF v_pengguna_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak terdaftar atau belum masuk';
  END IF;
  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Hanya admin atau pemilik yang dapat memposting jurnal';
  END IF;

  SELECT status INTO v_status FROM jurnal_umum WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jurnal tidak ditemukan';
  END IF;
  IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'Hanya jurnal berstatus draft yang dapat diposting';
  END IF;

  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(kredit), 0), COUNT(*)
  INTO v_total_debit, v_total_kredit, v_count
  FROM jurnal_umum_detail
  WHERE jurnal_umum_id = p_id;

  IF v_count < 2 THEN
    RAISE EXCEPTION 'Jurnal minimal harus mempunyai dua baris akun';
  END IF;
  IF v_total_debit <= 0 THEN
    RAISE EXCEPTION 'Total transaksi jurnal harus lebih besar dari nol';
  END IF;
  IF v_total_debit <> v_total_kredit THEN
    RAISE EXCEPTION 'Jurnal belum seimbang, total debit dan kredit harus sama untuk diposting';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jurnal_umum_detail d
    JOIN akun a ON a.id = d.akun_id
    WHERE d.jurnal_umum_id = p_id AND a.aktif = FALSE
  ) THEN
    RAISE EXCEPTION 'Terdapat akun tidak aktif pada jurnal ini, tidak dapat diposting';
  END IF;

  UPDATE jurnal_umum
  SET status = 'diposting', posted_at = NOW(), posted_by = v_pengguna_id, updated_at = NOW()
  WHERE id = p_id;
END;
$$;

-- Menghapus jurnal yang MASIH DRAFT (header + detail).
CREATE OR REPLACE FUNCTION delete_jurnal_umum_draft(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pengguna_id UUID;
  v_role VARCHAR;
  v_status VARCHAR;
BEGIN
  SELECT pengguna_id, role_kode INTO v_pengguna_id, v_role FROM current_pengguna_role();
  IF v_pengguna_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak terdaftar atau belum masuk';
  END IF;
  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Hanya admin atau pemilik yang dapat menghapus jurnal';
  END IF;

  SELECT status INTO v_status FROM jurnal_umum WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jurnal tidak ditemukan';
  END IF;
  IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'Jurnal berstatus diposting tidak boleh dihapus langsung, gunakan pembatalan/jurnal pembalik';
  END IF;

  DELETE FROM jurnal_umum_detail WHERE jurnal_umum_id = p_id;
  DELETE FROM jurnal_umum WHERE id = p_id;
END;
$$;

-- Membatalkan jurnal yang sudah diposting lewat jurnal pembalik (reversing entry), bukan hapus langsung.
CREATE OR REPLACE FUNCTION reverse_jurnal_umum(p_id UUID, p_alasan TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pengguna_id UUID;
  v_role VARCHAR;
  v_original jurnal_umum%ROWTYPE;
  v_nomor VARCHAR;
  v_new_id UUID;
BEGIN
  SELECT pengguna_id, role_kode INTO v_pengguna_id, v_role FROM current_pengguna_role();
  IF v_pengguna_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak terdaftar atau belum masuk';
  END IF;
  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Hanya admin atau pemilik yang dapat membatalkan jurnal';
  END IF;

  SELECT * INTO v_original FROM jurnal_umum WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jurnal tidak ditemukan';
  END IF;
  IF v_original.status <> 'diposting' THEN
    RAISE EXCEPTION 'Hanya jurnal berstatus diposting yang dapat dibatalkan dengan jurnal pembalik';
  END IF;

  v_nomor := next_nomor_jurnal(CURRENT_DATE);

  INSERT INTO jurnal_umum (
    cabang_id, nomor, tanggal, nomor_referensi, sumber, sumber_tabel, sumber_id,
    deskripsi, status, dibuat_oleh, posted_at, posted_by
  ) VALUES (
    v_original.cabang_id, v_nomor, CURRENT_DATE, v_original.nomor, 'pembalikan',
    'jurnal_umum', v_original.id,
    'Jurnal pembalik dari ' || v_original.nomor || COALESCE(': ' || NULLIF(p_alasan, ''), ''),
    'diposting', v_pengguna_id, NOW(), v_pengguna_id
  ) RETURNING id INTO v_new_id;

  INSERT INTO jurnal_umum_detail (jurnal_umum_id, akun_id, debit, kredit, keterangan)
  SELECT v_new_id, akun_id, kredit, debit, keterangan
  FROM jurnal_umum_detail
  WHERE jurnal_umum_id = v_original.id;

  UPDATE jurnal_umum SET status = 'dibatalkan', updated_at = NOW() WHERE id = v_original.id;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION create_jurnal_umum(DATE, VARCHAR, TEXT, VARCHAR, UUID, VARCHAR, VARCHAR, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_jurnal_umum(DATE, VARCHAR, TEXT, VARCHAR, UUID, VARCHAR, VARCHAR, UUID, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION update_jurnal_umum_draft(UUID, DATE, VARCHAR, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_jurnal_umum_draft(UUID, DATE, VARCHAR, TEXT, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION post_jurnal_umum(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION post_jurnal_umum(UUID) TO authenticated;

REVOKE ALL ON FUNCTION delete_jurnal_umum_draft(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_jurnal_umum_draft(UUID) TO authenticated;

REVOKE ALL ON FUNCTION reverse_jurnal_umum(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reverse_jurnal_umum(UUID, TEXT) TO authenticated;

-- Paksa seluruh perubahan data jurnal lewat fungsi di atas (bypass RLS via SECURITY DEFINER),
-- cegah manipulasi langsung dari client (mass-assignment / manipulasi nominal).
ALTER TABLE jurnal_umum ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurnal_umum_detail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jurnal_umum_select ON jurnal_umum;
CREATE POLICY jurnal_umum_select ON jurnal_umum FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS jurnal_umum_detail_select ON jurnal_umum_detail;
CREATE POLICY jurnal_umum_detail_select ON jurnal_umum_detail FOR SELECT TO authenticated USING (true);
`
