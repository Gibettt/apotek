package migrations

var Migration008CreateResepTable = `
CREATE TABLE IF NOT EXISTS resep (
  id SERIAL PRIMARY KEY,
  nomor_resep VARCHAR(50) UNIQUE NOT NULL,
  pelanggan_id INT REFERENCES pelanggan(id),
  penjualan_id INT REFERENCES penjualan(id),
  nama_dokter VARCHAR(150),
  no_sip_dokter VARCHAR(50),
  asal_puskesmas VARCHAR(150),
  tanggal_resep DATE,
  catatan TEXT,
  status VARCHAR(20) DEFAULT 'menunggu',
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resep_detail (
  id SERIAL PRIMARY KEY,
  resep_id INT REFERENCES resep(id),
  obat_id INT REFERENCES obat(id),
  aturan_pakai VARCHAR(200),
  jumlah INT,
  catatan TEXT
);`
