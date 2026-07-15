package migrations

var Migration006CreatePurchasingTables = `
CREATE TABLE IF NOT EXISTS surat_pesanan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID NOT NULL REFERENCES cabang(id),
  supplier_id UUID NOT NULL REFERENCES supplier(id),
  nomor VARCHAR(255) UNIQUE NOT NULL,
  jenis_sp VARCHAR(255) NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(255) NOT NULL DEFAULT 'draft',
  catatan TEXT,
  dibuat_oleh UUID REFERENCES pengguna(id),
  disetujui_oleh UUID REFERENCES pengguna(id),
  disetujui_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS surat_pesanan_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surat_pesanan_id UUID NOT NULL REFERENCES surat_pesanan(id),
  barang_id UUID NOT NULL REFERENCES barang(id),
  satuan_id UUID REFERENCES satuan(id),
  qty NUMERIC NOT NULL DEFAULT 0,
  harga_estimasi NUMERIC NOT NULL DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faktur_pembelian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID NOT NULL REFERENCES cabang(id),
  supplier_id UUID NOT NULL REFERENCES supplier(id),
  surat_pesanan_id UUID REFERENCES surat_pesanan(id),
  nomor_faktur VARCHAR(255) NOT NULL,
  nomor_internal VARCHAR(255) UNIQUE NOT NULL,
  tanggal_faktur DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_jatuh_tempo DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  diskon_total NUMERIC NOT NULL DEFAULT 0,
  pajak_total NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status VARCHAR(255) NOT NULL DEFAULT 'draft',
  catatan TEXT,
  dibuat_oleh UUID REFERENCES pengguna(id),
  diposting_oleh UUID REFERENCES pengguna(id),
  diposting_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faktur_pembelian_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faktur_pembelian_id UUID NOT NULL REFERENCES faktur_pembelian(id),
  barang_id UUID NOT NULL REFERENCES barang(id),
  batch_id UUID REFERENCES batch_barang(id),
  satuan_id UUID REFERENCES satuan(id),
  qty NUMERIC NOT NULL DEFAULT 0,
  harga_beli NUMERIC NOT NULL DEFAULT 0,
  diskon_persen NUMERIC NOT NULL DEFAULT 0,
  diskon_nominal NUMERIC NOT NULL DEFAULT 0,
  pajak_persen NUMERIC NOT NULL DEFAULT 0,
  pajak_nominal NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  harga_pokok NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retur_pembelian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID NOT NULL REFERENCES cabang(id),
  supplier_id UUID NOT NULL REFERENCES supplier(id),
  faktur_pembelian_id UUID REFERENCES faktur_pembelian(id),
  nomor VARCHAR(255) UNIQUE NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  total NUMERIC NOT NULL DEFAULT 0,
  status VARCHAR(255) NOT NULL DEFAULT 'draft',
  alasan TEXT,
  dibuat_oleh UUID REFERENCES pengguna(id),
  diposting_oleh UUID REFERENCES pengguna(id),
  diposting_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retur_pembelian_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retur_pembelian_id UUID NOT NULL REFERENCES retur_pembelian(id),
  barang_id UUID NOT NULL REFERENCES barang(id),
  batch_id UUID REFERENCES batch_barang(id),
  satuan_id UUID REFERENCES satuan(id),
  qty NUMERIC NOT NULL DEFAULT 0,
  harga_retur NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  alasan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
