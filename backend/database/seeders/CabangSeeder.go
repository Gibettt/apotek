package seeders

var CabangSeederSQL = `
INSERT INTO cabang (kode, nama, aktif) VALUES
('PST', 'Apotek Pusat', TRUE)
ON CONFLICT DO NOTHING;`
