package migrations

var Migration003CreatePartnerTables = `
CREATE TABLE IF NOT EXISTS supplier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  tipe_supplier VARCHAR(255),
  npwp VARCHAR(255),
  telepon VARCHAR(255),
  email VARCHAR(255),
  alamat TEXT,
  kota VARCHAR(255),
  provinsi VARCHAR(255),
  contact_person VARCHAR(255),
  tempo_bayar_hari INT NOT NULL DEFAULT 0,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pelanggan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  telepon VARCHAR(255),
  email VARCHAR(255),
  alamat TEXT,
  tanggal_lahir DATE,
  jenis_kelamin VARCHAR(255),
  catatan_alergi TEXT,
  member BOOLEAN NOT NULL DEFAULT FALSE,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dokter_spesialis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dokter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  nomor_sip VARCHAR(255),
  spesialis_id UUID REFERENCES dokter_spesialis(id),
  telepon VARCHAR(255),
  email VARCHAR(255),
  alamat TEXT,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
