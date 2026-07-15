// Mock data untuk modul ERP yang belum punya tabel Supabase khusus.
// Bentuk baris sudah datar (denormalisasi) agar langsung dipakai ModuleListPage.

export const satuanList = [
  { id: "st-1", kode: "TAB", nama: "Tablet", deskripsi: "Satuan tablet", aktif: true },
  { id: "st-2", kode: "BOX", nama: "Box", deskripsi: "Kemasan box", aktif: true },
  { id: "st-3", kode: "STR", nama: "Strip", deskripsi: "Kemasan strip", aktif: true },
  { id: "st-4", kode: "BTL", nama: "Botol", deskripsi: "Satuan botol sirup", aktif: true },
  { id: "st-5", kode: "PCS", nama: "Pcs", deskripsi: "Satuan buah", aktif: true }
];

export const jenisBarangList = [
  { id: "jb-1", kode: "OBT", nama: "Obat", deskripsi: "Produk obat", aktif: true },
  { id: "jb-2", kode: "ALKES", nama: "Alat Kesehatan", deskripsi: "Alat kesehatan", aktif: true },
  { id: "jb-3", kode: "BHP", nama: "Bahan Habis Pakai", deskripsi: "BHP medis", aktif: true },
  { id: "jb-4", kode: "SUPP", nama: "Suplemen", deskripsi: "Suplemen & vitamin", aktif: true }
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

export const principalList = [
  { id: "pr-1", kode: "APL", nama: "PT Anugrah Pharmindo Lestari", telepon: "021-29578000", alamat: "Jakarta", aktif: true },
  { id: "pr-2", kode: "EPMT", nama: "PT Enseval Putera Megatrading", telepon: "021-4682111", alamat: "Jakarta", aktif: true },
  { id: "pr-3", kode: "AAM", nama: "PT Anak Agung Medika", telepon: "0361-234567", alamat: "Denpasar", aktif: true }
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
  { id: "ro-2", kode: "admin", nama: "Admin", deskripsi: "Kelola master data & operasional" },
  { id: "ro-3", kode: "apoteker", nama: "Apoteker", deskripsi: "Verifikasi resep & stok" },
  { id: "ro-4", kode: "kasir", nama: "Kasir", deskripsi: "Transaksi penjualan" }
];

export const permissionList = [
  { id: "pm-1", kode: "obat.view", nama: "Lihat Obat", modul: "Master", deskripsi: "Melihat daftar obat" },
  { id: "pm-2", kode: "obat.edit", nama: "Ubah Obat", modul: "Master", deskripsi: "Menambah/ubah obat" },
  { id: "pm-3", kode: "penjualan.create", nama: "Buat Penjualan", modul: "Penjualan", deskripsi: "Transaksi kasir" },
  { id: "pm-4", kode: "pembelian.create", nama: "Buat Pembelian", modul: "Pembelian", deskripsi: "Buat faktur beli" },
  { id: "pm-5", kode: "laporan.view", nama: "Lihat Laporan", modul: "Laporan", deskripsi: "Akses laporan" },
  { id: "pm-6", kode: "user.manage", nama: "Kelola User", modul: "Manajemen", deskripsi: "Kelola user & role" }
];

export const jurnalUmumList = [
  { id: "ju-1", nomor: "JU-2026-0001", tanggal: "2026-07-01", sumber: "penjualan", deskripsi: "Penjualan tunai harian", status: "posted" },
  { id: "ju-2", nomor: "JU-2026-0002", tanggal: "2026-07-02", sumber: "pembelian", deskripsi: "Pembelian dari Kimia Farma", status: "posted" },
  { id: "ju-3", nomor: "JU-2026-0003", tanggal: "2026-07-03", sumber: "manual", deskripsi: "Penyesuaian kas kecil", status: "draft" },
  { id: "ju-4", nomor: "JU-2026-0004", tanggal: "2026-07-05", sumber: "biaya", deskripsi: "Pembayaran listrik", status: "posted" }
];

export const biayaOperasionalList = [
  { id: "bo-1", nomor: "BOP-2026-0001", tanggal: "2026-07-01", namaBiaya: "Listrik", jumlah: 1250000, metodeBayar: "transfer", catatan: "Tagihan Juli" },
  { id: "bo-2", nomor: "BOP-2026-0002", tanggal: "2026-07-02", namaBiaya: "Air", jumlah: 350000, metodeBayar: "tunai", catatan: "" },
  { id: "bo-3", nomor: "BOP-2026-0003", tanggal: "2026-07-05", namaBiaya: "Gaji Karyawan", jumlah: 8500000, metodeBayar: "transfer", catatan: "Gaji bulan Juli" },
  { id: "bo-4", nomor: "BOP-2026-0004", tanggal: "2026-07-08", namaBiaya: "Internet", jumlah: 500000, metodeBayar: "transfer", catatan: "" }
];

export const returPembelianList = [
  { id: "rp-1", nomor: "RB-2026-0001", tanggal: "2026-07-03", namaSupplier: "PT Sehat Farma", total: 450000, status: "posted", alasan: "Barang rusak" },
  { id: "rp-2", nomor: "RB-2026-0002", tanggal: "2026-07-06", namaSupplier: "Dexa Medica", total: 1200000, status: "draft", alasan: "Mendekati expired" }
];

export const suratPesananList = [
  { id: "sp-1", nomor: "SP-2026-0001", jenisSp: "Reguler", tanggal: "2026-07-01", namaSupplier: "PT Sehat Farma", status: "disetujui" },
  { id: "sp-2", nomor: "SP-2026-0002", jenisSp: "Narkotika", tanggal: "2026-07-04", namaSupplier: "Kimia Farma", status: "draft" },
  { id: "sp-3", nomor: "SP-2026-0003", jenisSp: "Psikotropika", tanggal: "2026-07-07", namaSupplier: "Kimia Farma", status: "disetujui" }
];

export const auditLogList = [
  { id: "al-1", waktu: "2026-07-10T08:30:00", aksi: "INSERT", namaTabel: "penjualan", pengguna: "Admin Apotek" },
  { id: "al-2", waktu: "2026-07-10T09:15:00", aksi: "UPDATE", namaTabel: "barang", pengguna: "Admin Apotek" },
  { id: "al-3", waktu: "2026-07-10T10:00:00", aksi: "DELETE", namaTabel: "supplier", pengguna: "Owner" },
  { id: "al-4", waktu: "2026-07-11T14:20:00", aksi: "INSERT", namaTabel: "pembelian", pengguna: "Admin Apotek" }
];
