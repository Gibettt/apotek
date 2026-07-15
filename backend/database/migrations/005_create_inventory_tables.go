package migrations

var Migration005CreateInventoryTables = `
CREATE TABLE IF NOT EXISTS saldo_stok (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID NOT NULL REFERENCES cabang(id),
  barang_id UUID NOT NULL REFERENCES barang(id),
  batch_id UUID REFERENCES batch_barang(id),
  lokasi_simpan_id UUID REFERENCES lokasi_simpan(id),
  qty NUMERIC NOT NULL DEFAULT 0,
  qty_reserved NUMERIC NOT NULL DEFAULT 0,
  harga_pokok_rata NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS saldo_stok_scope_unique
  ON saldo_stok (cabang_id, barang_id, COALESCE(batch_id, '00000000-0000-0000-0000-000000000000'), COALESCE(lokasi_simpan_id, '00000000-0000-0000-0000-000000000000'));

CREATE TABLE IF NOT EXISTS kartu_stok (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cabang_id UUID NOT NULL REFERENCES cabang(id),
  barang_id UUID NOT NULL REFERENCES barang(id),
  batch_id UUID REFERENCES batch_barang(id),
  tipe_mutasi VARCHAR(255) NOT NULL,
  sumber_tabel VARCHAR(255),
  sumber_id UUID,
  qty_masuk NUMERIC NOT NULL DEFAULT 0,
  qty_keluar NUMERIC NOT NULL DEFAULT 0,
  saldo_akhir NUMERIC NOT NULL DEFAULT 0,
  harga_pokok NUMERIC NOT NULL DEFAULT 0,
  keterangan TEXT,
  dibuat_oleh UUID REFERENCES pengguna(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stok_opname (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID NOT NULL REFERENCES cabang(id),
  nomor VARCHAR(255) NOT NULL,
  tanggal TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(255) NOT NULL DEFAULT 'draft',
  catatan TEXT,
  dibuat_oleh UUID REFERENCES pengguna(id),
  diposting_oleh UUID REFERENCES pengguna(id),
  diposting_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stok_opname_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stok_opname_id UUID NOT NULL REFERENCES stok_opname(id),
  barang_id UUID NOT NULL REFERENCES barang(id),
  batch_id UUID REFERENCES batch_barang(id),
  lokasi_simpan_id UUID REFERENCES lokasi_simpan(id),
  qty_sistem NUMERIC NOT NULL DEFAULT 0,
  qty_fisik NUMERIC NOT NULL DEFAULT 0,
  selisih NUMERIC,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mutasi_stok (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor VARCHAR(255) NOT NULL,
  tanggal TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cabang_asal_id UUID REFERENCES cabang(id),
  cabang_tujuan_id UUID REFERENCES cabang(id),
  status VARCHAR(255) NOT NULL DEFAULT 'draft',
  catatan TEXT,
  dibuat_oleh UUID REFERENCES pengguna(id),
  diposting_oleh UUID REFERENCES pengguna(id),
  diposting_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mutasi_stok_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mutasi_stok_id UUID NOT NULL REFERENCES mutasi_stok(id),
  barang_id UUID NOT NULL REFERENCES barang(id),
  batch_id UUID REFERENCES batch_barang(id),
  satuan_id UUID REFERENCES satuan(id),
  qty NUMERIC NOT NULL DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
