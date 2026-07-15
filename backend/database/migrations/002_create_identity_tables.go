package migrations

var Migration002CreateIdentityTables = `
CREATE TABLE IF NOT EXISTS cabang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  telepon VARCHAR(255),
  email VARCHAR(255),
  alamat TEXT,
  kota VARCHAR(255),
  provinsi VARCHAR(255),
  kode_pos VARCHAR(255),
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(255) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  modul VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES role(id),
  permission_id UUID NOT NULL REFERENCES permission(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS pengguna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  nama_lengkap VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  email VARCHAR(255),
  telepon VARCHAR(255),
  role_id UUID REFERENCES role(id),
  status VARCHAR(255) NOT NULL DEFAULT 'aktif',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS pengguna_auth_user_id_unique ON pengguna(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pengguna_email_unique ON pengguna(email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS pengguna_cabang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id UUID NOT NULL REFERENCES pengguna(id),
  cabang_id UUID NOT NULL REFERENCES cabang(id),
  default_cabang BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pengguna_id, cabang_id)
);`
