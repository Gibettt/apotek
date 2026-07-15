import {
  golonganObat,
  kategoriBarang,
  obat,
  pelanggan,
  settings,
  suppliers
} from "@/lib/mock-data";
import { cabangService } from "@/services/cabangService";
import { dokterService } from "@/services/dokterService";
import { golonganService } from "@/services/golonganService";
import { kategoriService } from "@/services/kategoriService";
import { notifikasiService } from "@/services/notifikasiService";
import { obatService } from "@/services/obatService";
import { pelangganService } from "@/services/pelangganService";
import { pembelianService } from "@/services/pembelianService";
import { penjualanService } from "@/services/penjualanService";
import { resepService } from "@/services/resepService";
import { stokService } from "@/services/stokService";
import { supplierService } from "@/services/supplierService";
import { userService } from "@/services/userService";
import {
  akunList,
  auditLogList,
  biayaOperasionalList,
  jenisBarangList,
  jurnalUmumList,
  lokasiSimpanList,
  pabrikList,
  permissionList,
  principalList,
  returPembelianList,
  roleList,
  satuanList,
  suratPesananList
} from "@/lib/erp-mock";
import type { PengaturanGroup } from "@/types";

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
  load: () => Promise<ModuleRecord[]>;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  detailTitleKey?: string;
  allowDetail?: boolean;
  allowEdit?: boolean;
}

const LOAD_ALL: { perPage: number } = { perPage: 9999 };

const kategoriOptions = kategoriBarang.map((item) => ({
  label: item.nama,
  value: item.id
}));

const golonganOptions = golonganObat.map((item) => ({
  label: item.nama,
  value: item.id
}));

const supplierOptions = suppliers.map((item) => ({
  label: item.nama,
  value: item.id
}));

const pelangganOptions = pelanggan.map((item) => ({
  label: item.nama,
  value: item.id
}));

const obatOptions = obat.map((item) => ({
  label: item.nama,
  value: item.id
}));

export const moduleConfigs = {
  obat: {
    key: "obat",
    title: "Obat",
    description: "Daftar obat dengan harga, stok, kategori, golongan, dan status resep.",
    basePath: "/obat",
    addPath: "/obat/tambah",
    load: async () => {
      const result = await obatService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        kategori: item.kategoriNama ?? "-",
        stokTersedia: item.stokTersedia,
        stokMinimum: item.stokMinimum,
        hargaBeli: item.hargaAktif?.hargaBeli ?? 0,
        hargaJual: item.hargaAktif?.hargaJual ?? 0,
        golongan: item.golonganNama ?? "-",
        membutuhkanResep: item.membutuhkanResep,
        status: item.status
      }));
    },
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Nama Obat" },
      { key: "kategori", header: "Kategori" },
      { key: "stokTersedia", header: "Stok", type: "number" },
      { key: "hargaJual", header: "Harga Jual", type: "currency" },
      { key: "status", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kode", label: "Kode Obat", type: "text", defaultValue: "OBT-0005" },
      { name: "nama", label: "Nama Obat", type: "text" },
      { name: "kategoriId", label: "Kategori", type: "select", options: kategoriOptions },
      { name: "golonganId", label: "Golongan", type: "select", options: golonganOptions },
      { name: "satuanDefaultId", label: "Satuan", type: "text", defaultValue: "tablet" },
      { name: "hargaBeli", label: "Harga Beli", type: "number" },
      { name: "hargaJual", label: "Harga Jual", type: "number" },
      { name: "stokMinimum", label: "Stok Minimum", type: "number", defaultValue: 50 },
      { name: "membutuhkanResep", label: "Membutuhkan Resep", type: "checkbox" },
      { name: "status", label: "Aktif", type: "checkbox", defaultValue: true },
      { name: "komposisi", label: "Komposisi", type: "textarea" },
      { name: "indikasi", label: "Indikasi", type: "textarea" },
      { name: "aturanPakai", label: "Aturan Pakai", type: "textarea" }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  kategori: {
    key: "kategori",
    title: "Kategori Obat",
    description: "Pengelompokan obat untuk pencarian, laporan, dan pengaturan etalase.",
    basePath: "/kategori",
    addPath: "/kategori/tambah",
    load: async () => {
      const result = await kategoriService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        nama: item.nama,
        deskripsi: item.deskripsi ?? "-",
        updatedAt: item.updatedAt
      }));
    },
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
    load: async () => {
      const result = await supplierService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        nama: item.nama,
        kontakPerson: item.kontakPerson ?? "-",
        telepon: item.telepon ?? "-",
        email: item.email ?? "-",
        aktif: item.aktif
      }));
    },
    columns: [
      { key: "nama", header: "Supplier" },
      { key: "kontakPerson", header: "Kontak" },
      { key: "telepon", header: "Telepon" },
      { key: "email", header: "Email" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "nama", label: "Nama Supplier", type: "text" },
      { name: "kontakPerson", label: "Kontak Person", type: "text" },
      { name: "telepon", label: "Telepon", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "npwp", label: "NPWP", type: "text" },
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  pelanggan: {
    key: "pelanggan",
    title: "Pelanggan",
    description: "Data pasien, kontak, dan catatan alergi.",
    basePath: "/pelanggan",
    addPath: "/pelanggan/tambah",
    load: async () => {
      const result = await pelangganService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        nama: item.nama,
        telepon: item.telepon ?? "-",
        jenisKelamin: item.jenisKelamin ?? "-",
        tanggalLahir: item.tanggalLahir ?? "-",
        catatanAlergi: item.catatanAlergi ?? "-"
      }));
    },
    columns: [
      { key: "nama", header: "Nama" },
      { key: "telepon", header: "Telepon" },
      { key: "jenisKelamin", header: "JK" },
      { key: "tanggalLahir", header: "Lahir", type: "date" },
      { key: "catatanAlergi", header: "Alergi" }
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
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "catatanAlergi", label: "Alergi", type: "textarea" }
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
    load: async () => {
      const result = await stokService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        namaBarang: item.namaBarang,
        nomorBatch: item.nomorBatch,
        tanggalExpired: item.tanggalExpired ?? "-",
        qty: item.qty,
        lokasiNama: item.lokasiNama ?? "-"
      }));
    },
    columns: [
      { key: "namaBarang", header: "Obat" },
      { key: "nomorBatch", header: "Batch" },
      { key: "tanggalExpired", header: "Expired", type: "date" },
      { key: "qty", header: "Jumlah", type: "number" },
      { key: "lokasiNama", header: "Lokasi" }
    ],
    fields: [
      { name: "barangId", label: "Obat", type: "select", options: obatOptions },
      { name: "nomorBatch", label: "Batch", type: "text" },
      { name: "tanggalExpired", label: "Tanggal Expired", type: "date" },
      { name: "qty", label: "Jumlah", type: "number" },
      { name: "lokasiNama", label: "Lokasi", type: "text" },
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
    load: async () => {
      const result = await pembelianService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        nomorInternal: item.nomorInternal,
        namaSupplier: item.namaSupplier,
        tanggalFaktur: item.tanggalFaktur,
        grandTotal: item.grandTotal,
        status: item.status
      }));
    },
    columns: [
      { key: "nomorInternal", header: "Nomor" },
      { key: "namaSupplier", header: "Supplier" },
      { key: "tanggalFaktur", header: "Tanggal", type: "date" },
      { key: "grandTotal", header: "Total", type: "currency" },
      { key: "status", header: "Status", type: "status" }
    ],
    fields: [
      { name: "supplierId", label: "Supplier", type: "select", options: supplierOptions },
      { name: "tanggalFaktur", label: "Tanggal Pembelian", type: "date" },
      { name: "catatan", label: "Catatan", type: "textarea" }
    ],
    detailTitleKey: "nomorInternal",
    allowDetail: true,
    allowEdit: false
  },
  penjualan: {
    key: "penjualan",
    title: "Penjualan",
    description: "Riwayat transaksi kasir, pembayaran, kembalian, dan status.",
    basePath: "/penjualan",
    load: async () => {
      const result = await penjualanService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        nomorInvoice: item.nomorInvoice,
        namaPelanggan: item.namaPelanggan,
        tanggal: item.tanggal,
        metodePembayaran: item.metodePembayaran ?? "-",
        grandTotal: item.grandTotal,
        status: item.status
      }));
    },
    columns: [
      { key: "nomorInvoice", header: "Nomor" },
      { key: "namaPelanggan", header: "Pelanggan" },
      { key: "tanggal", header: "Waktu", type: "datetime" },
      { key: "metodePembayaran", header: "Bayar" },
      { key: "grandTotal", header: "Total", type: "currency" },
      { key: "status", header: "Status", type: "status" }
    ],
    fields: [],
    detailTitleKey: "nomorInvoice",
    allowDetail: true,
    allowEdit: false
  },
  resep: {
    key: "resep",
    title: "Resep",
    description: "Resep dokter untuk diverifikasi apoteker dan diproses ke penjualan.",
    basePath: "/resep",
    addPath: "/resep/tambah",
    load: async () => {
      const result = await resepService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        nomorResep: item.nomorResep ?? "-",
        namaPelanggan: item.namaPelanggan,
        namaDokter: item.namaDokter,
        tanggalResep: item.tanggalResep,
        status: item.status
      }));
    },
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
    load: async () => {
      const result = await notifikasiService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        tipe: item.tipe,
        judul: item.judul,
        pesan: item.pesan ?? "-",
        targetRole: item.targetRole ?? "-",
        isRead: item.isRead,
        createdAt: item.createdAt
      }));
    },
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
    load: async () => {
      const result = await userService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        namaLengkap: item.namaLengkap,
        email: item.email ?? "-",
        role: item.role,
        status: item.status,
        updatedAt: item.updatedAt
      }));
    },
    columns: [
      { key: "namaLengkap", header: "Nama" },
      { key: "email", header: "Email" },
      { key: "role", header: "Role" },
      { key: "status", header: "Status", type: "boolean" },
      { key: "updatedAt", header: "Update", type: "date" }
    ],
    fields: [
      { name: "namaLengkap", label: "Nama", type: "text" },
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
    detailTitleKey: "namaLengkap",
    allowEdit: true
  },
  golongan: {
    key: "golongan",
    title: "Golongan Obat",
    description: "Klasifikasi obat: bebas, keras, narkotika, psikotropika, dan aturan resepnya.",
    basePath: "/golongan",
    addPath: "/golongan/tambah",
    load: async () => {
      const result = await golonganService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        butuhResep: item.butuhResep,
        butuhSuratPesanan: item.butuhSuratPesanan,
        deskripsi: item.deskripsi ?? "-",
        aktif: item.aktif
      }));
    },
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Golongan" },
      { key: "butuhResep", header: "Wajib Resep", type: "boolean" },
      { key: "butuhSuratPesanan", header: "Wajib SP", type: "boolean" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kode", label: "Kode Golongan", type: "text" },
      { name: "nama", label: "Nama Golongan", type: "text" },
      { name: "butuhResep", label: "Membutuhkan Resep", type: "checkbox" },
      { name: "butuhSuratPesanan", label: "Membutuhkan Surat Pesanan", type: "checkbox" },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  dokter: {
    key: "dokter",
    title: "Dokter",
    description: "Data dokter penulis resep beserta nomor SIP dan spesialisasi.",
    basePath: "/dokter",
    addPath: "/dokter/tambah",
    load: async () => {
      const result = await dokterService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        nomorSip: item.nomorSip ?? "-",
        spesialis: item.spesialisNama ?? "-",
        telepon: item.telepon ?? "-",
        aktif: item.aktif
      }));
    },
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Nama Dokter" },
      { key: "nomorSip", header: "No SIP" },
      { key: "spesialis", header: "Spesialis" },
      { key: "telepon", header: "Telepon" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kode", label: "Kode Dokter", type: "text" },
      { name: "nama", label: "Nama Dokter", type: "text" },
      { name: "nomorSip", label: "Nomor SIP", type: "text" },
      { name: "telepon", label: "Telepon", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  cabang: {
    key: "cabang",
    title: "Cabang",
    description: "Daftar cabang apotek beserta kontak dan lokasi operasional.",
    basePath: "/cabang",
    addPath: "/cabang/tambah",
    load: async () => {
      const result = await cabangService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        kota: item.kota ?? "-",
        telepon: item.telepon ?? "-",
        email: item.email ?? "-",
        aktif: item.aktif
      }));
    },
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Cabang" },
      { key: "kota", header: "Kota" },
      { key: "telepon", header: "Telepon" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kode", label: "Kode Cabang", type: "text" },
      { name: "nama", label: "Nama Cabang", type: "text" },
      { name: "telepon", label: "Telepon", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "kota", label: "Kota", type: "text" },
      { name: "provinsi", label: "Provinsi", type: "text" },
      { name: "kodePos", label: "Kode Pos", type: "text" },
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  satuan: {
    key: "satuan",
    title: "Satuan",
    description: "Satuan unit barang: tablet, box, strip, botol.",
    basePath: "/satuan",
    addPath: "/satuan/tambah",
    load: async () => [...satuanList],
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Satuan" },
      { key: "deskripsi", header: "Deskripsi" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kode", label: "Kode Satuan", type: "text" },
      { name: "nama", label: "Nama Satuan", type: "text" },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  jenisBarang: {
    key: "jenisBarang",
    title: "Jenis Barang",
    description: "Klasifikasi jenis barang: obat, alkes, BHP, suplemen.",
    basePath: "/jenis-barang",
    addPath: "/jenis-barang/tambah",
    load: async () => [...jenisBarangList],
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Jenis" },
      { key: "deskripsi", header: "Deskripsi" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kode", label: "Kode Jenis", type: "text" },
      { name: "nama", label: "Nama Jenis", type: "text" },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  lokasiSimpan: {
    key: "lokasiSimpan",
    title: "Lokasi Simpan",
    description: "Rak dan lemari penyimpanan stok obat.",
    basePath: "/lokasi-simpan",
    addPath: "/lokasi-simpan/tambah",
    load: async () => [...lokasiSimpanList],
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Lokasi" },
      { key: "tipeLokasi", header: "Tipe" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kode", label: "Kode Lokasi", type: "text" },
      { name: "nama", label: "Nama Lokasi", type: "text" },
      { name: "tipeLokasi", label: "Tipe Lokasi", type: "text" },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  pabrik: {
    key: "pabrik",
    title: "Pabrik",
    description: "Produsen/manufaktur obat.",
    basePath: "/pabrik",
    addPath: "/pabrik/tambah",
    load: async () => [...pabrikList],
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Pabrik" },
      { key: "telepon", header: "Telepon" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kode", label: "Kode Pabrik", type: "text" },
      { name: "nama", label: "Nama Pabrik", type: "text" },
      { name: "telepon", label: "Telepon", type: "text" },
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  principal: {
    key: "principal",
    title: "Principal / Distributor",
    description: "Distributor resmi (PBF) sumber pengadaan obat.",
    basePath: "/principal",
    addPath: "/principal/tambah",
    load: async () => [...principalList],
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Distributor" },
      { key: "telepon", header: "Telepon" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kode", label: "Kode", type: "text" },
      { name: "nama", label: "Nama Distributor", type: "text" },
      { name: "telepon", label: "Telepon", type: "text" },
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  akun: {
    key: "akun",
    title: "Akun (Chart of Accounts)",
    description: "Daftar akun buku besar untuk pencatatan akuntansi.",
    basePath: "/akun",
    addPath: "/akun/tambah",
    load: async () => [...akunList],
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Nama Akun" },
      { key: "tipe", header: "Tipe", type: "status" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "kode", label: "Kode Akun", type: "text" },
      { name: "nama", label: "Nama Akun", type: "text" },
      {
        name: "tipe",
        label: "Tipe Akun",
        type: "select",
        options: [
          { label: "Aset", value: "Aset" },
          { label: "Kewajiban", value: "Kewajiban" },
          { label: "Modal", value: "Modal" },
          { label: "Pendapatan", value: "Pendapatan" },
          { label: "Beban", value: "Beban" }
        ]
      },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  role: {
    key: "role",
    title: "Role",
    description: "Peran akses pengguna dalam sistem.",
    basePath: "/role",
    addPath: "/role/tambah",
    load: async () => [...roleList],
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Role" },
      { key: "deskripsi", header: "Deskripsi" }
    ],
    fields: [
      { name: "kode", label: "Kode Role", type: "text" },
      { name: "nama", label: "Nama Role", type: "text" },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  permission: {
    key: "permission",
    title: "Permission",
    description: "Hak akses granular per modul.",
    basePath: "/permission",
    addPath: "/permission/tambah",
    load: async () => [...permissionList],
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Permission" },
      { key: "modul", header: "Modul" },
      { key: "deskripsi", header: "Deskripsi" }
    ],
    fields: [
      { name: "kode", label: "Kode Permission", type: "text" },
      { name: "nama", label: "Nama Permission", type: "text" },
      { name: "modul", label: "Modul", type: "text" },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true
  },
  jurnal: {
    key: "jurnal",
    title: "Jurnal Umum",
    description: "Catatan jurnal akuntansi dari transaksi dan penyesuaian manual.",
    basePath: "/jurnal",
    load: async () => [...jurnalUmumList],
    columns: [
      { key: "nomor", header: "Nomor" },
      { key: "tanggal", header: "Tanggal", type: "date" },
      { key: "sumber", header: "Sumber", type: "status" },
      { key: "deskripsi", header: "Deskripsi" },
      { key: "status", header: "Status", type: "status" }
    ],
    fields: [],
    detailTitleKey: "nomor",
    allowDetail: true
  },
  biaya: {
    key: "biaya",
    title: "Biaya Operasional",
    description: "Pencatatan biaya operasional apotek.",
    basePath: "/biaya",
    addPath: "/biaya/tambah",
    load: async () => [...biayaOperasionalList],
    columns: [
      { key: "nomor", header: "Nomor" },
      { key: "tanggal", header: "Tanggal", type: "date" },
      { key: "namaBiaya", header: "Nama Biaya" },
      { key: "jumlah", header: "Jumlah", type: "currency" },
      { key: "metodeBayar", header: "Metode" }
    ],
    fields: [
      { name: "tanggal", label: "Tanggal", type: "date" },
      { name: "namaBiaya", label: "Nama Biaya", type: "text" },
      { name: "jumlah", label: "Jumlah", type: "number" },
      {
        name: "metodeBayar",
        label: "Metode Bayar",
        type: "select",
        options: [
          { label: "Tunai", value: "tunai" },
          { label: "Transfer", value: "transfer" }
        ]
      },
      { name: "catatan", label: "Catatan", type: "textarea" }
    ],
    detailTitleKey: "nomor",
    allowDetail: true
  },
  retur: {
    key: "retur",
    title: "Retur Pembelian",
    description: "Pengembalian barang ke supplier.",
    basePath: "/retur",
    load: async () => [...returPembelianList],
    columns: [
      { key: "nomor", header: "Nomor" },
      { key: "tanggal", header: "Tanggal", type: "date" },
      { key: "namaSupplier", header: "Supplier" },
      { key: "total", header: "Total", type: "currency" },
      { key: "status", header: "Status", type: "status" }
    ],
    fields: [],
    detailTitleKey: "nomor",
    allowDetail: true
  },
  suratPesanan: {
    key: "suratPesanan",
    title: "Surat Pesanan",
    description: "Surat pesanan (SP) pengadaan ke supplier, termasuk SP khusus narkotika/psikotropika.",
    basePath: "/surat-pesanan",
    load: async () => [...suratPesananList],
    columns: [
      { key: "nomor", header: "Nomor" },
      { key: "jenisSp", header: "Jenis SP", type: "status" },
      { key: "tanggal", header: "Tanggal", type: "date" },
      { key: "namaSupplier", header: "Supplier" },
      { key: "status", header: "Status", type: "status" }
    ],
    fields: [],
    detailTitleKey: "nomor",
    allowDetail: true
  },
  auditLog: {
    key: "auditLog",
    title: "Audit Log",
    description: "Jejak aktivitas perubahan data di sistem.",
    basePath: "/audit-log",
    load: async () => [...auditLogList],
    columns: [
      { key: "waktu", header: "Waktu", type: "datetime" },
      { key: "aksi", header: "Aksi", type: "status" },
      { key: "namaTabel", header: "Tabel" },
      { key: "pengguna", header: "Pengguna" }
    ],
    fields: []
  }
} satisfies Record<string, ModuleConfig>;

export const stokMutasiConfig: ModuleConfig = {
  key: "stok-mutasi",
  title: "Mutasi Stok",
  description: "Histori semua perubahan stok dari pembelian, penjualan, manual, dan opname.",
  basePath: "/stok",
  load: async () => {
    const result = await stokService.mutations(LOAD_ALL);
    return result.data.map((item) => ({
      id: item.id,
      namaBarang: item.namaBarang,
      tipeMutasi: item.tipeMutasi,
      qtyMasuk: item.qtyMasuk,
      qtyKeluar: item.qtyKeluar,
      saldoAkhir: item.saldoAkhir,
      sumberTabel: item.sumberTabel ?? "-",
      createdAt: item.createdAt
    }));
  },
  columns: [
    { key: "namaBarang", header: "Obat" },
    { key: "tipeMutasi", header: "Tipe", type: "status" },
    { key: "qtyMasuk", header: "Masuk", type: "number" },
    { key: "qtyKeluar", header: "Keluar", type: "number" },
    { key: "saldoAkhir", header: "Saldo Akhir", type: "number" },
    { key: "sumberTabel", header: "Sumber" },
    { key: "createdAt", header: "Waktu", type: "datetime" }
  ],
  fields: []
};

export function getModuleConfig(key: keyof typeof moduleConfigs) {
  return moduleConfigs[key];
}

export function getSettingsByGroup(group: PengaturanGroup) {
  return settings.filter((item) => item.group === group);
}
