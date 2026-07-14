package seeders

var ObatSeederSQL = `
INSERT INTO kategori_obat (nama, deskripsi) VALUES
('Analgesik', 'Pereda nyeri dan demam'),
('Antibiotik', 'Obat keras untuk infeksi bakteri'),
('Vitamin', 'Suplemen harian')
ON CONFLICT DO NOTHING;`
