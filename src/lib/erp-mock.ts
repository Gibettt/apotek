// Mock data untuk modul ERP yang belum punya tabel Supabase khusus.
// Bentuk baris sudah datar (denormalisasi) agar langsung dipakai ModuleListPage.

export const satuanList = [
  { id: "st-1", kode: "TAB", nama: "Tablet", deskripsi: "Satuan tablet", aktif: true },
  { id: "st-2", kode: "BOX", nama: "Box", deskripsi: "Kemasan box", aktif: true },
  { id: "st-3", kode: "STR", nama: "Strip", deskripsi: "Kemasan strip", aktif: true },
  { id: "st-4", kode: "BTL", nama: "Botol", deskripsi: "Satuan botol sirup", aktif: true },
  { id: "st-5", kode: "PCS", nama: "Pcs", deskripsi: "Satuan buah", aktif: true }
];

export const lokasiSimpanList = [
  { id: "lk-1", kode: "RAK-A", nama: "Rak A", tipeLokasi: "Rak", deskripsi: "Obat bebas", aktif: true },
  { id: "lk-2", kode: "RAK-B", nama: "Rak B", tipeLokasi: "Rak", deskripsi: "Obat keras", aktif: true },
  { id: "lk-3", kode: "LEMARI-N", nama: "Lemari Narkotika", tipeLokasi: "Lemari", deskripsi: "Narkotika & psikotropika", aktif: true },
  { id: "lk-4", kode: "KULKAS", nama: "Kulkas Vaksin", tipeLokasi: "Cold Storage", deskripsi: "Produk rantai dingin", aktif: true }
];

export const pabrikList = [
  { id: "pb-1", kode: "KF", nama: "Kimia Farma", telepon: "021-3456789", alamat: "Jakarta", aktif: true },
  { id: "pb-2", kode: "DEXA", nama: "Dexa Medica", telepon: "0711-5551234", alamat: "Palembang", aktif: true },
  { id: "pb-3", kode: "KLBF", nama: "Kalbe Farma", telepon: "021-42873888", alamat: "Jakarta", aktif: true },
  { id: "pb-4", kode: "SANBE", nama: "Sanbe Farma", telepon: "022-6032222", alamat: "Bandung", aktif: true }
];

export const akunList = [
  { id: "ak-1", kode: "1-100", nama: "Kas", tipe: "Aset", aktif: true },
  { id: "ak-2", kode: "1-110", nama: "Bank", tipe: "Aset", aktif: true },
  { id: "ak-3", kode: "1-200", nama: "Persediaan Obat", tipe: "Aset", aktif: true },
  { id: "ak-4", kode: "2-100", nama: "Utang Supplier", tipe: "Kewajiban", aktif: true },
  { id: "ak-5", kode: "3-100", nama: "Modal Pemilik", tipe: "Modal", aktif: true },
  { id: "ak-6", kode: "4-100", nama: "Pendapatan Penjualan", tipe: "Pendapatan", aktif: true },
  { id: "ak-7", kode: "5-100", nama: "Beban Operasional", tipe: "Beban", aktif: true },
  { id: "ak-8", kode: "5-200", nama: "Beban Gaji", tipe: "Beban", aktif: true }
];

export const roleList = [
  { id: "ro-1", kode: "owner", nama: "Owner", deskripsi: "Akses penuh seluruh sistem" },
  { id: "ro-4", kode: "kasir", nama: "Kasir", deskripsi: "Transaksi penjualan" }
];

export const suratPesananList = [
  { id: "sp-1", nomor: "SP-2026-0001", jenisSp: "Reguler", tanggal: "2026-07-01", namaSupplier: "PT Sehat Farma", status: "disetujui" },
  { id: "sp-2", nomor: "SP-2026-0002", jenisSp: "Narkotika", tanggal: "2026-07-04", namaSupplier: "Kimia Farma", status: "draft" },
  { id: "sp-3", nomor: "SP-2026-0003", jenisSp: "Psikotropika", tanggal: "2026-07-07", namaSupplier: "Kimia Farma", status: "disetujui" }
];

