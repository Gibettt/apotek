package migrations

var Migration004CreateItemMasterTables = `
CREATE TABLE IF NOT EXISTS kategori_barang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jenis_barang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS golongan_obat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  butuh_resep BOOLEAN NOT NULL DEFAULT FALSE,
  butuh_surat_pesanan BOOLEAN NOT NULL DEFAULT FALSE,
  deskripsi TEXT,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pabrik (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  alamat TEXT,
  telepon VARCHAR(255),
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS principal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  alamat TEXT,
  telepon VARCHAR(255),
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lokasi_simpan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID REFERENCES cabang(id),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  tipe_lokasi VARCHAR(255),
  deskripsi TEXT,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS satuan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) UNIQUE NOT NULL,
  barcode_default VARCHAR(255),
  nama VARCHAR(255) NOT NULL,
  nama_generik VARCHAR(255),
  kategori_id UUID REFERENCES kategori_barang(id),
  jenis_id UUID REFERENCES jenis_barang(id),
  golongan_id UUID REFERENCES golongan_obat(id),
  pabrik_id UUID REFERENCES pabrik(id),
  principal_id UUID REFERENCES principal(id),
  satuan_default_id UUID REFERENCES satuan(id),
  satuan_beli_id UUID REFERENCES satuan(id),
  satuan_jual_id UUID REFERENCES satuan(id),
  lokasi_default_id UUID REFERENCES lokasi_simpan(id),
  komposisi TEXT,
  indikasi TEXT,
  aturan_pakai TEXT,
  gambar_url TEXT,
  stok_minimum NUMERIC NOT NULL DEFAULT 0,
  stok_maksimum NUMERIC NOT NULL DEFAULT 0,
  perlu_batch BOOLEAN NOT NULL DEFAULT TRUE,
  perlu_expired BOOLEAN NOT NULL DEFAULT TRUE,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS konversi_satuan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barang_id UUID NOT NULL REFERENCES barang(id),
  satuan_dari_id UUID NOT NULL REFERENCES satuan(id),
  satuan_ke_id UUID NOT NULL REFERENCES satuan(id),
  nilai_konversi NUMERIC NOT NULL,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS harga_barang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barang_id UUID NOT NULL REFERENCES barang(id),
  cabang_id UUID REFERENCES cabang(id),
  tipe_harga VARCHAR(255) NOT NULL DEFAULT 'jual',
  satuan_id UUID REFERENCES satuan(id),
  harga_beli NUMERIC NOT NULL DEFAULT 0,
  harga_jual NUMERIC NOT NULL DEFAULT 0,
  margin_persen NUMERIC,
  tanggal_mulai DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_selesai DATE,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW v_harga_barang_aktif AS
SELECT DISTINCT ON (barang_id, cabang_id, tipe_harga) *
FROM harga_barang
WHERE aktif
  AND tanggal_mulai <= CURRENT_DATE
  AND (tanggal_selesai IS NULL OR tanggal_selesai >= CURRENT_DATE)
ORDER BY barang_id, cabang_id, tipe_harga, tanggal_mulai DESC;

CREATE TABLE IF NOT EXISTS barcode_barang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barang_id UUID NOT NULL REFERENCES barang(id),
  satuan_id UUID REFERENCES satuan(id),
  barcode VARCHAR(255) NOT NULL,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batch_barang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barang_id UUID NOT NULL REFERENCES barang(id),
  supplier_id UUID REFERENCES supplier(id),
  pabrik_id UUID REFERENCES pabrik(id),
  kode_produksi VARCHAR(255),
  nomor_batch VARCHAR(255) NOT NULL,
  tanggal_produksi DATE,
  tanggal_expired DATE,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
