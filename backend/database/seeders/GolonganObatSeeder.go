package seeders

var GolonganObatSeederSQL = `
INSERT INTO golongan_obat (kode, nama, butuh_resep, butuh_surat_pesanan) VALUES
('bebas', 'Obat Bebas', FALSE, FALSE),
('bebas_terbatas', 'Obat Bebas Terbatas', FALSE, FALSE),
('keras', 'Obat Keras', TRUE, TRUE)
ON CONFLICT DO NOTHING;`
