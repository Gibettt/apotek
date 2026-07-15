package migrations

var Migration009CreateNotifikasiPengaturanTables = `
CREATE TABLE IF NOT EXISTS notifikasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID REFERENCES cabang(id),
  pengguna_id UUID REFERENCES pengguna(id),
  target_role VARCHAR(50),
  tipe VARCHAR(50) NOT NULL,
  judul VARCHAR(200) NOT NULL,
  pesan TEXT,
  referensi_tabel VARCHAR(100),
  referensi_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pengaturan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabang_id UUID REFERENCES cabang(id),
  key VARCHAR(100) NOT NULL,
  value TEXT,
  "group" VARCHAR(50),
  label VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pengaturan_key_index ON pengaturan(key);`
