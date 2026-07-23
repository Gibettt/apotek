package seeders

var AkunSeederSQL = `
INSERT INTO akun (kode, nama, tipe, aktif) VALUES
('1101', 'Kas', 'Aset', TRUE),
('1102', 'Bank', 'Aset', TRUE),
('1201', 'Piutang Usaha', 'Aset', TRUE),
('1301', 'Persediaan Obat', 'Aset', TRUE),
('2101', 'Utang Usaha', 'Liabilitas', TRUE),
('3101', 'Modal', 'Ekuitas', TRUE),
('4101', 'Penjualan Obat', 'Pendapatan', TRUE),
('5101', 'Harga Pokok Penjualan', 'Beban', TRUE),
('6101', 'Beban Gaji', 'Beban', TRUE),
('6102', 'Beban Listrik', 'Beban', TRUE),
('6103', 'Beban Operasional', 'Beban', TRUE)
ON CONFLICT DO NOTHING;`
