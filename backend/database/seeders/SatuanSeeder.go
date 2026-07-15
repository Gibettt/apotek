package seeders

var SatuanSeederSQL = `
INSERT INTO satuan (kode, nama) VALUES
('pcs', 'Pcs'),
('tablet', 'Tablet'),
('kapsul', 'Kapsul'),
('strip', 'Strip'),
('box', 'Box'),
('botol', 'Botol'),
('tube', 'Tube')
ON CONFLICT DO NOTHING;`
