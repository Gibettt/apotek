package migrations

var Migration004CreateSupplierPelangganTable = `
CREATE TABLE IF NOT EXISTS supplier (
  id SERIAL PRIMARY KEY,
  nama_supplier VARCHAR(150) NOT NULL,
  telepon VARCHAR(20),
  email VARCHAR(150),
  alamat TEXT,
  kontak_person VARCHAR(100),
  npwp VARCHAR(30),
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pelanggan (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  telepon VARCHAR(20),
  alamat TEXT,
  tanggal_lahir DATE,
  jenis_kelamin VARCHAR(10),
  no_bpjs VARCHAR(30),
  no_ktp VARCHAR(20),
  alergi TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`
