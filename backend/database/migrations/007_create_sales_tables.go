package migrations

var Migration007CreateSalesTables = `
CREATE TABLE IF NOT EXISTS shift_kasir (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID NOT NULL REFERENCES cabang(id),
  kasir_id UUID NOT NULL REFERENCES pengguna(id),
  nomor_shift VARCHAR(255) NOT NULL,
  waktu_buka TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waktu_tutup TIMESTAMPTZ,
  saldo_awal NUMERIC NOT NULL DEFAULT 0,
  saldo_akhir_sistem NUMERIC NOT NULL DEFAULT 0,
  saldo_akhir_fisik NUMERIC NOT NULL DEFAULT 0,
  selisih NUMERIC NOT NULL DEFAULT 0,
  status VARCHAR(255) NOT NULL DEFAULT 'terbuka',
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS penjualan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID NOT NULL REFERENCES cabang(id),
  shift_kasir_id UUID REFERENCES shift_kasir(id),
  pelanggan_id UUID REFERENCES pelanggan(id),
  nomor_invoice VARCHAR(255) UNIQUE NOT NULL,
  tanggal TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipe_penjualan VARCHAR(255) NOT NULL DEFAULT 'umum',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  diskon_total NUMERIC NOT NULL DEFAULT 0,
  pajak_total NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  bayar_total NUMERIC NOT NULL DEFAULT 0,
  kembalian NUMERIC NOT NULL DEFAULT 0,
  status_bayar VARCHAR(255) NOT NULL DEFAULT 'belum_bayar',
  status VARCHAR(255) NOT NULL DEFAULT 'draft',
  catatan TEXT,
  dibuat_oleh UUID REFERENCES pengguna(id),
  payment_provider VARCHAR(30),
  payment_external_id VARCHAR(100),
  payment_provider_id VARCHAR(100),
  payment_transaction_id VARCHAR(100),
  payment_url TEXT,
  payment_status VARCHAR(30),
  payment_expires_at TIMESTAMPTZ,
  accurate_invoice_id BIGINT,
  accurate_sync_status VARCHAR(30),
  accurate_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS penjualan_payment_external_id_unique
  ON penjualan(payment_external_id)
  WHERE payment_external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS penjualan_payment_status_index
  ON penjualan(payment_status);

CREATE TABLE IF NOT EXISTS penjualan_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penjualan_id UUID NOT NULL REFERENCES penjualan(id),
  barang_id UUID NOT NULL REFERENCES barang(id),
  batch_id UUID REFERENCES batch_barang(id),
  satuan_id UUID REFERENCES satuan(id),
  qty NUMERIC NOT NULL DEFAULT 0,
  harga_jual NUMERIC NOT NULL DEFAULT 0,
  diskon_persen NUMERIC NOT NULL DEFAULT 0,
  diskon_nominal NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  harga_pokok NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penjualan_id UUID REFERENCES penjualan(id),
  pelanggan_id UUID REFERENCES pelanggan(id),
  dokter_id UUID REFERENCES dokter(id),
  nomor_resep VARCHAR(255),
  tanggal_resep DATE NOT NULL DEFAULT CURRENT_DATE,
  nama_pasien VARCHAR(255),
  umur_pasien VARCHAR(255),
  alamat_pasien TEXT,
  catatan TEXT,
  status VARCHAR(255) NOT NULL DEFAULT 'menunggu',
  dibuat_oleh UUID REFERENCES pengguna(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resep_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resep_id UUID NOT NULL REFERENCES resep(id),
  barang_id UUID REFERENCES barang(id),
  satuan_id UUID REFERENCES satuan(id),
  qty NUMERIC NOT NULL DEFAULT 0,
  aturan_pakai TEXT,
  instruksi_racikan TEXT,
  racikan BOOLEAN NOT NULL DEFAULT FALSE,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pembayaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penjualan_id UUID NOT NULL REFERENCES penjualan(id),
  metode VARCHAR(255) NOT NULL,
  jumlah NUMERIC NOT NULL DEFAULT 0,
  nomor_referensi VARCHAR(255),
  nama_bank VARCHAR(255),
  waktu_bayar TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  catatan TEXT,
  dibuat_oleh UUID REFERENCES pengguna(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
