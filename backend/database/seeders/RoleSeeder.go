package seeders

var RoleSeederSQL = `
INSERT INTO role (kode, nama, deskripsi) VALUES
('owner', 'Owner', 'Akses penuh ke seluruh cabang dan modul'),
('admin', 'Admin', 'Master data dan operasional'),
('apoteker', 'Apoteker', 'Obat, stok, dan resep'),
('kasir', 'Kasir', 'POS dan riwayat transaksi')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO permission (kode, nama, modul) VALUES
('cabang.manage', 'Kelola cabang', 'cabang'),
('barang.manage', 'Kelola obat/barang', 'barang'),
('kategori.manage', 'Kelola kategori', 'kategori'),
('supplier.manage', 'Kelola supplier', 'supplier'),
('pelanggan.manage', 'Kelola pelanggan', 'pelanggan'),
('stok.manage', 'Kelola stok', 'stok'),
('pembelian.manage', 'Kelola pembelian', 'pembelian'),
('penjualan.manage', 'Kelola penjualan', 'penjualan'),
('resep.manage', 'Kelola resep', 'resep'),
('laporan.view', 'Lihat laporan', 'laporan'),
('notifikasi.view', 'Lihat notifikasi', 'notifikasi'),
('pengaturan.manage', 'Kelola pengaturan', 'pengaturan'),
('users.manage', 'Kelola pengguna', 'users')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.kode = 'owner'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.kode IN (
  'barang.manage', 'kategori.manage', 'supplier.manage', 'pelanggan.manage',
  'stok.manage', 'pembelian.manage', 'laporan.view', 'notifikasi.view', 'pengaturan.manage'
)
WHERE r.kode = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.kode IN (
  'barang.manage', 'stok.manage', 'resep.manage', 'notifikasi.view'
)
WHERE r.kode = 'apoteker'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.kode IN (
  'penjualan.manage', 'pelanggan.manage', 'notifikasi.view'
)
WHERE r.kode = 'kasir'
ON CONFLICT (role_id, permission_id) DO NOTHING;`
