package migrations

var Migration008CreateFinanceAuditTables = `
CREATE TABLE IF NOT EXISTS akun (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  tipe VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES akun(id),
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jurnal_umum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID REFERENCES cabang(id),
  nomor VARCHAR(255) UNIQUE NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  sumber VARCHAR(255) NOT NULL,
  sumber_tabel VARCHAR(255),
  sumber_id UUID,
  deskripsi TEXT,
  status VARCHAR(255) NOT NULL DEFAULT 'draft',
  dibuat_oleh UUID REFERENCES pengguna(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jurnal_umum_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurnal_umum_id UUID NOT NULL REFERENCES jurnal_umum(id),
  akun_id UUID NOT NULL REFERENCES akun(id),
  debit NUMERIC NOT NULL DEFAULT 0,
  kredit NUMERIC NOT NULL DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biaya_operasional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID REFERENCES cabang(id),
  akun_id UUID REFERENCES akun(id),
  nomor VARCHAR(255) UNIQUE NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  nama_biaya VARCHAR(255) NOT NULL,
  jumlah NUMERIC NOT NULL DEFAULT 0,
  metode_bayar VARCHAR(255),
  catatan TEXT,
  dibuat_oleh UUID REFERENCES pengguna(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waktu TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pengguna_id UUID REFERENCES pengguna(id),
  cabang_id UUID REFERENCES cabang(id),
  aksi VARCHAR(255) NOT NULL,
  schema_tabel VARCHAR(255),
  nama_tabel VARCHAR(255),
  row_id UUID,
  data_lama JSONB,
  data_baru JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
