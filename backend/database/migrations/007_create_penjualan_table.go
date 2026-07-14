package migrations

var Migration007CreatePenjualanTable = `
CREATE TABLE IF NOT EXISTS penjualan (
  id SERIAL PRIMARY KEY,
  nomor_penjualan VARCHAR(50) UNIQUE NOT NULL,
  pelanggan_id INT REFERENCES pelanggan(id),
  resep_id INT,
  tanggal_penjualan TIMESTAMP DEFAULT NOW(),
  subtotal DECIMAL(15,2) DEFAULT 0,
  diskon DECIMAL(15,2) DEFAULT 0,
  pajak DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  metode_pembayaran VARCHAR(30),
  bayar DECIMAL(15,2) DEFAULT 0,
  kembalian DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'selesai',
  catatan TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS penjualan_detail (
  id SERIAL PRIMARY KEY,
  penjualan_id INT REFERENCES penjualan(id),
  obat_id INT REFERENCES obat(id),
  jumlah INT,
  harga_jual DECIMAL(15,2),
  diskon DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2)
);`
