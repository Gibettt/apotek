package migrations

var Migration005CreateStokTable = `
CREATE TABLE IF NOT EXISTS stok (
  id SERIAL PRIMARY KEY,
  obat_id INT REFERENCES obat(id),
  batch_number VARCHAR(100),
  tanggal_expired DATE,
  jumlah INT DEFAULT 0,
  lokasi VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stok_mutasi (
  id SERIAL PRIMARY KEY,
  obat_id INT REFERENCES obat(id),
  tipe_mutasi VARCHAR(20) NOT NULL,
  jumlah INT NOT NULL,
  sumber VARCHAR(50) NOT NULL,
  referensi_id INT,
  stok_sebelum INT DEFAULT 0,
  stok_sesudah INT DEFAULT 0,
  keterangan TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);`
