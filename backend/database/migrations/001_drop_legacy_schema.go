package migrations

var Migration001DropLegacySchema = `
DROP FUNCTION IF EXISTS finalize_accurate_payment(VARCHAR, VARCHAR);

DROP TABLE IF EXISTS
  resep_detail,
  resep,
  penjualan_detail,
  penjualan,
  pembelian_detail,
  pembelian,
  stok_mutasi,
  stok,
  pelanggan,
  supplier,
  notifikasi,
  settings,
  obat,
  kategori_obat,
  users,
  roles
CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;`
