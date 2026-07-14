package migrations

var Migration009CreateNotifikasiSettingsTable = `
CREATE TABLE IF NOT EXISTS notifikasi (
  id SERIAL PRIMARY KEY,
  tipe VARCHAR(50),
  judul VARCHAR(200),
  pesan TEXT,
  referensi_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  target_role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  "group" VARCHAR(50),
  label VARCHAR(150)
);`
