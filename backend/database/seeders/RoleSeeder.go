package seeders

var RoleSeederSQL = `
INSERT INTO roles (name, description) VALUES
('owner', 'Akses penuh'),
('admin', 'Master data dan operasional'),
('apoteker', 'Obat, stok, dan resep'),
('kasir', 'POS dan riwayat transaksi')
ON CONFLICT (name) DO NOTHING;`
