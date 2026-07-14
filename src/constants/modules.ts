import {
  kategoriObat,
  notifikasi,
  obat,
  pelanggan,
  pembelian,
  penjualan,
  resep,
  settings,
  stokBatches,
  stokMutasi,
  suppliers,
  users
} from "@/lib/mock-data";
import type { SettingGroup } from "@/types";

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "checkbox";

export type ColumnType =
  | "text"
  | "currency"
  | "date"
  | "datetime"
  | "status"
  | "boolean"
  | "number";

export interface OptionConfig {
  label: string;
  value: string | number | boolean;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  options?: OptionConfig[];
  placeholder?: string;
  defaultValue?: string | number | boolean;
}

export interface ColumnConfig {
  key: string;
  header: string;
  type?: ColumnType;
}

export type ModuleRecord = Record<string, string | number | boolean | undefined>;

export interface ModuleConfig {
  key: string;
  title: string;
  description: string;
  basePath: string;
  addPath?: string;
  rows: ModuleRecord[];
  columns: ColumnConfig[];
  fields: FieldConfig[];
  detailTitleKey?: string;
  allowDetail?: boolean;
  allowEdit?: boolean;
}

const kategoriOptions = kategoriObat.map((item) => ({
  label: item.nama,
  value: item.id
}));

const supplierOptions = suppliers.map((item) => ({
  label: item.namaSupplier,
  value: item.id
}));

const pelangganOptions = pelanggan.map((item) => ({
  label: item.nama,
  value: item.id
}));

const obatOptions = obat.map((item) => ({
  label: item.namaObat,
  value: item.id
}));

export const moduleConfigs = {
  obat: {
    key: "obat",
    title: "Obat",
    description: "Daftar obat dengan harga, stok, kategori, supplier, dan status resep.",
    basePath: "/obat",
    addPath: "/obat/tambah",
    rows: obat.map((item) => ({
      id: item.id,
      kodeObat: item.kodeObat,
      namaObat: item.namaObat,
      kategori:
        kategoriObat.find((kategori) => kategori.id === item.kategoriId)?.nama ??
        "-",
      supplier:
        suppliers.find((supplier) => supplier.id === item.supplierId)
          ?.namaSupplier ?? "-",
      stokTersedia: item.stokTersedia,
      stokMinimum: item.stokMinimum,
      hargaJual: item.hargaJual,
      golongan: item.golongan,
      membutuhkanResep: item.membutuhkanResep,
      status: item.status
    })),
    columns: [
      { key: "kodeObat", header: "Kode" },
      { key: "namaObat", header: "Nama Obat" },
      { key: "kategori", header: "Kategori" },
      { key: "stokTersedia", header: "Stok", type: "number" },
      { key: "hargaJual", header: "Harga Jual", type: "currency" },
      { key: "status", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kodeObat", label: "Kode Obat", type: "text", defaultValue: "OBT-0005" },
      { name: "namaObat", label: "Nama Obat", type: "text" },
      { name: "kategoriId", label: "Kategori", type: "select", options: kategoriOptions },
      { name: "supplierId", label: "Supplier", type: "select", options: supplierOptions },
      { name: "satuan", label: "Satuan", type: "text", defaultValue: "tablet" },
      { name: "hargaBeli", label: "Harga Beli", type: "number" },
      { name: "hargaJual", label: "Harga Jual", type: "number" },
      { name: "stokMinimum", label: "Stok Minimum", type: "number", defaultValue: 50 },
      {
        name: "golongan",
        label: "Golongan",
        type: "select",
        options: [
          { label: "Bebas", value: "bebas" },
          { label: "Bebas Terbatas", value: "bebas terbatas" },
          { label: "Keras", value: "keras" }
        ]
      },
      { name: "membutuhkanResep", label: "Membutuhkan Resep", type: "checkbox" },
      { name: "status", label: "Aktif", type: "checkbox", defaultValue: true },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" }
    ],
    detailTitleKey: "namaObat",
    allowDetail: true,
    allowEdit: true
  },
  kategori: {
    key: "kategori",
    title: "Kategori Obat",
    description: "Pengelompokan obat untuk pencarian, laporan, dan pengaturan etalase.",
    basePath: "/kategori",
    addPath: "/kategori/tambah",
    rows: kategoriObat.map((item) => ({
      id: item.id,
      nama: item.nama,
      deskripsi: item.deskripsi,
      updatedAt: item.updatedAt
    })),
    columns: [
      { key: "nama", header: "Kategori" },
      { key: "deskripsi", header: "Deskripsi" },
      { key: "updatedAt", header: "Update", type: "date" }
    ],
    fields: [
      { name: "nama", label: "Nama Kategori", type: "text" },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" }
    ],
    detailTitleKey: "nama",
    allowEdit: true
  },
  supplier: {
    key: "supplier",
    title: "Supplier",
    description: "Pemasok obat dan kontak pembelian.",
    basePath: "/supplier",
    addPath: "/supplier/tambah",
    rows: suppliers.map((item) => ({
      id: item.id,
      namaSupplier: item.namaSupplier,
      kontakPerson: item.kontakPerson,
      telepon: item.telepon,
      email: item.email,
      status: item.status
    })),
    columns: [
      { key: "namaSupplier", header: "Supplier" },
      { key: "kontakPerson", header: "Kontak" },
      { key: "telepon", header: "Telepon" },
      { key: "email", header: "Email" },
      { key: "status", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "namaSupplier", label: "Nama Supplier", type: "text" },
      { name: "kontakPerson", label: "Kontak Person", type: "text" },
      { name: "telepon", label: "Telepon", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "npwp", label: "NPWP", type: "text" },
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "status", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "namaSupplier",
    allowDetail: true,
    allowEdit: true
  },
  pelanggan: {
    key: "pelanggan",
    title: "Pelanggan",
    description: "Data pasien, kontak, BPJS, KTP, dan catatan alergi.",
    basePath: "/pelanggan",
    addPath: "/pelanggan/tambah",
    rows: pelanggan.map((item) => ({
      id: item.id,
      nama: item.nama,
      telepon: item.telepon,
      jenisKelamin: item.jenisKelamin,
      tanggalLahir: item.tanggalLahir,
      alergi: item.alergi ?? "-"
    })),
    columns: [
      { key: "nama", header: "Nama" },
      { key: "telepon", header: "Telepon" },
      { key: "jenisKelamin", header: "JK" },
      { key: "tanggalLahir", header: "Lahir", type: "date" },
      { key: "alergi", header: "Alergi" }
    ],
    fields: [
      { name: "nama", label: "Nama", type: "text" },
      { name: "telepon", label: "Telepon", type: "text" },
      { name: "tanggalLahir", label: "Tanggal Lahir", type: "date" },
      {
        name: "jenisKelamin",
        label: "Jenis Kelamin",
        type: "select",
        options: [
          { label: "Laki-laki", value: "L" },
          { label: "Perempuan", value: "P" }
        ]
      },
      { name: "noBpjs", label: "No BPJS", type: "text" },
      { name: "noKtp", label: "No KTP", type: "text" },
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "alergi", label: "Alergi", type: "textarea" }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  stok: {
    key: "stok",
    title: "Stok",
    description: "Batch stok semua obat, lokasi rak, jumlah, dan tanggal expired.",
    basePath: "/stok",
    rows: stokBatches.map((item) => ({
      id: item.id,
      namaObat: item.namaObat,
      batchNumber: item.batchNumber,
      tanggalExpired: item.tanggalExpired,
      jumlah: item.jumlah,
      lokasi: item.lokasi
    })),
    columns: [
      { key: "namaObat", header: "Obat" },
      { key: "batchNumber", header: "Batch" },
      { key: "tanggalExpired", header: "Expired", type: "date" },
      { key: "jumlah", header: "Jumlah", type: "number" },
      { key: "lokasi", header: "Lokasi" }
    ],
    fields: [
      { name: "obatId", label: "Obat", type: "select", options: obatOptions },
      { name: "batchNumber", label: "Batch", type: "text" },
      { name: "tanggalExpired", label: "Tanggal Expired", type: "date" },
      { name: "jumlah", label: "Jumlah", type: "number" },
      { name: "lokasi", label: "Lokasi", type: "text" },
      { name: "keterangan", label: "Keterangan", type: "textarea" }
    ],
    allowDetail: false,
    allowEdit: false
  },
  pembelian: {
    key: "pembelian",
    title: "Pembelian",
    description: "Purchase order dari supplier, status draft sampai diterima.",
    basePath: "/pembelian",
    addPath: "/pembelian/tambah",
    rows: pembelian.map((item) => ({
      id: item.id,
      nomorPembelian: item.nomorPembelian,
      namaSupplier: item.namaSupplier,
      tanggalPembelian: item.tanggalPembelian,
      total: item.total,
      status: item.status
    })),
    columns: [
      { key: "nomorPembelian", header: "Nomor" },
      { key: "namaSupplier", header: "Supplier" },
      { key: "tanggalPembelian", header: "Tanggal", type: "date" },
      { key: "total", header: "Total", type: "currency" },
      { key: "status", header: "Status", type: "status" }
    ],
    fields: [
      { name: "supplierId", label: "Supplier", type: "select", options: supplierOptions },
      { name: "tanggalPembelian", label: "Tanggal Pembelian", type: "date" },
      { name: "catatan", label: "Catatan", type: "textarea" }
    ],
    detailTitleKey: "nomorPembelian",
    allowDetail: true,
    allowEdit: false
  },
  penjualan: {
    key: "penjualan",
    title: "Penjualan",
    description: "Riwayat transaksi kasir, pembayaran, kembalian, dan status.",
    basePath: "/penjualan",
    rows: penjualan.map((item) => ({
      id: item.id,
      nomorPenjualan: item.nomorPenjualan,
      namaPelanggan: item.namaPelanggan,
      tanggalPenjualan: item.tanggalPenjualan,
      metodePembayaran: item.metodePembayaran,
      total: item.total,
      status: item.status
    })),
    columns: [
      { key: "nomorPenjualan", header: "Nomor" },
      { key: "namaPelanggan", header: "Pelanggan" },
      { key: "tanggalPenjualan", header: "Waktu", type: "datetime" },
      { key: "metodePembayaran", header: "Bayar" },
      { key: "total", header: "Total", type: "currency" },
      { key: "status", header: "Status", type: "status" }
    ],
    fields: [],
    detailTitleKey: "nomorPenjualan",
    allowDetail: true,
    allowEdit: false
  },
  resep: {
    key: "resep",
    title: "Resep",
    description: "Resep dokter untuk diverifikasi apoteker dan diproses ke penjualan.",
    basePath: "/resep",
    addPath: "/resep/tambah",
    rows: resep.map((item) => ({
      id: item.id,
      nomorResep: item.nomorResep,
      namaPelanggan: item.namaPelanggan,
      namaDokter: item.namaDokter,
      tanggalResep: item.tanggalResep,
      status: item.status
    })),
    columns: [
      { key: "nomorResep", header: "Nomor" },
      { key: "namaPelanggan", header: "Pelanggan" },
      { key: "namaDokter", header: "Dokter" },
      { key: "tanggalResep", header: "Tanggal", type: "date" },
      { key: "status", header: "Status", type: "status" }
    ],
    fields: [
      { name: "pelangganId", label: "Pelanggan", type: "select", options: pelangganOptions },
      { name: "namaDokter", label: "Nama Dokter", type: "text" },
      { name: "noSipDokter", label: "No SIP Dokter", type: "text" },
      { name: "asalPuskesmas", label: "Asal Faskes", type: "text" },
      { name: "tanggalResep", label: "Tanggal Resep", type: "date" },
      { name: "catatan", label: "Catatan", type: "textarea" }
    ],
    detailTitleKey: "nomorResep",
    allowDetail: true,
    allowEdit: false
  },
  notifikasi: {
    key: "notifikasi",
    title: "Notifikasi",
    description: "Peringatan stok, expired, dan pesan sistem.",
    basePath: "/notifikasi",
    rows: notifikasi.map((item) => ({
      id: item.id,
      tipe: item.tipe,
      judul: item.judul,
      pesan: item.pesan,
      targetRole: item.targetRole,
      isRead: item.isRead,
      createdAt: item.createdAt
    })),
    columns: [
      { key: "tipe", header: "Tipe", type: "status" },
      { key: "judul", header: "Judul" },
      { key: "targetRole", header: "Role" },
      { key: "isRead", header: "Baca", type: "boolean" },
      { key: "createdAt", header: "Waktu", type: "datetime" }
    ],
    fields: [],
    allowDetail: false,
    allowEdit: false
  },
  users: {
    key: "users",
    title: "Users",
    description: "Manajemen user, status, dan role akses.",
    basePath: "/users",
    addPath: "/users/tambah",
    rows: users.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      role: item.role,
      status: item.status,
      updatedAt: item.updatedAt
    })),
    columns: [
      { key: "name", header: "Nama" },
      { key: "email", header: "Email" },
      { key: "role", header: "Role" },
      { key: "status", header: "Status", type: "boolean" },
      { key: "updatedAt", header: "Update", type: "date" }
    ],
    fields: [
      { name: "name", label: "Nama", type: "text" },
      { name: "email", label: "Email", type: "email" },
      {
        name: "role",
        label: "Role",
        type: "select",
        options: [
          { label: "Owner", value: "owner" },
          { label: "Admin", value: "admin" },
          { label: "Apoteker", value: "apoteker" },
          { label: "Kasir", value: "kasir" }
        ]
      },
      { name: "status", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "name",
    allowEdit: true
  }
} satisfies Record<string, ModuleConfig>;

export const stokMutasiConfig: ModuleConfig = {
  key: "stok-mutasi",
  title: "Mutasi Stok",
  description: "Histori semua perubahan stok dari pembelian, penjualan, manual, dan opname.",
  basePath: "/stok",
  rows: stokMutasi.map((item) => ({
    id: item.id,
    namaObat: item.namaObat,
    tipeMutasi: item.tipeMutasi,
    jumlah: item.jumlah,
    sumber: item.sumber,
    stokSebelum: item.stokSebelum,
    stokSesudah: item.stokSesudah,
    createdAt: item.createdAt
  })),
  columns: [
    { key: "namaObat", header: "Obat" },
    { key: "tipeMutasi", header: "Tipe", type: "status" },
    { key: "jumlah", header: "Jumlah", type: "number" },
    { key: "sumber", header: "Sumber" },
    { key: "stokSebelum", header: "Sebelum", type: "number" },
    { key: "stokSesudah", header: "Sesudah", type: "number" },
    { key: "createdAt", header: "Waktu", type: "datetime" }
  ],
  fields: []
};

export function getModuleConfig(key: keyof typeof moduleConfigs) {
  return moduleConfigs[key];
}

export function getSettingsByGroup(group: SettingGroup) {
  return settings.filter((item) => item.group === group);
}
