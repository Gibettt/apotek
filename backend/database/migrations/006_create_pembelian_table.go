package migrations

var Migration006CreatePembelianTable = `
CREATE TABLE IF NOT EXISTS pembelian (
  id SERIAL PRIMARY KEY,
  nomor_pembelian VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INT REFERENCES supplier(id),
  tanggal_pembelian DATE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  diskon DECIMAL(15,2) DEFAULT 0,
  pajak DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  catatan TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pembelian_detail (
  id SERIAL PRIMARY KEY,
  pembelian_id INT REFERENCES pembelian(id),
  obat_id INT REFERENCES obat(id),
  batch_number VARCHAR(100),
  tanggal_expired DATE,
  jumlah INT,
  harga_beli DECIMAL(15,2),
  diskon DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2)
);`
