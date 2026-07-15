package seeders

// BarangSeederSQL inserts a handful of sample kategori_barang/barang/harga_barang
// rows for manual smoke testing after migration. Optional, safe to skip.
var BarangSeederSQL = `
INSERT INTO kategori_barang (kode, nama, deskripsi) VALUES
('analgesik', 'Analgesik', 'Pereda nyeri dan demam'),
('antibiotik', 'Antibiotik', 'Obat keras untuk infeksi bakteri'),
('vitamin', 'Vitamin', 'Suplemen harian')
ON CONFLICT DO NOTHING;

INSERT INTO barang (kode, nama, kategori_id, golongan_id, satuan_default_id, stok_minimum, stok_maksimum)
SELECT 'PCT500', 'Paracetamol 500mg', k.id, g.id, s.id, 20, 200
FROM kategori_barang k, golongan_obat g, satuan s
WHERE k.kode = 'analgesik' AND g.kode = 'bebas' AND s.kode = 'tablet'
ON CONFLICT (kode) DO NOTHING;

INSERT INTO barang (kode, nama, kategori_id, golongan_id, satuan_default_id, stok_minimum, stok_maksimum)
SELECT 'AMX500', 'Amoxicillin 500mg', k.id, g.id, s.id, 10, 100
FROM kategori_barang k, golongan_obat g, satuan s
WHERE k.kode = 'antibiotik' AND g.kode = 'keras' AND s.kode = 'kapsul'
ON CONFLICT (kode) DO NOTHING;

INSERT INTO barang (kode, nama, kategori_id, golongan_id, satuan_default_id, stok_minimum, stok_maksimum)
SELECT 'VITC500', 'Vitamin C 500mg', k.id, g.id, s.id, 20, 200
FROM kategori_barang k, golongan_obat g, satuan s
WHERE k.kode = 'vitamin' AND g.kode = 'bebas' AND s.kode = 'tablet'
ON CONFLICT (kode) DO NOTHING;

INSERT INTO harga_barang (barang_id, cabang_id, tipe_harga, harga_beli, harga_jual)
SELECT b.id, c.id, 'jual', prices.beli, prices.jual
FROM barang b
JOIN cabang c ON c.kode = 'PST'
JOIN (VALUES
  ('PCT500', 500::numeric, 1000::numeric),
  ('AMX500', 1200::numeric, 2500::numeric),
  ('VITC500', 800::numeric, 1500::numeric)
) AS prices(kode, beli, jual) ON prices.kode = b.kode
WHERE NOT EXISTS (
  SELECT 1 FROM harga_barang hb WHERE hb.barang_id = b.id AND hb.cabang_id = c.id
);`
