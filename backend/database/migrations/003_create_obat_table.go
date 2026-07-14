package migrations

var Migration003CreateObatTable = `
CREATE TABLE IF NOT EXISTS kategori_obat (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS obat (
  id SERIAL PRIMARY KEY,
  kode_obat VARCHAR(50) UNIQUE NOT NULL,
  nama_obat VARCHAR(200) NOT NULL,
  kategori_id INT REFERENCES kategori_obat(id),
  supplier_id INT,
  satuan VARCHAR(30),
  harga_beli DECIMAL(15,2) DEFAULT 0,
  harga_jual DECIMAL(15,2) DEFAULT 0,
  stok_minimum INT DEFAULT 0,
  gambar_url TEXT,
  deskripsi TEXT,
  golongan VARCHAR(50),
  membutuhkan_resep BOOLEAN DEFAULT FALSE,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`
