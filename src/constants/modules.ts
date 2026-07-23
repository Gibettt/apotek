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
import { akunService } from "@/services/akunService";
import { pelangganService } from "@/services/pelangganService";
import { pembelianService } from "@/services/pembelianService";
import { penjualanService } from "@/services/penjualanService";
import { resepService } from "@/services/resepService";
import { stokService } from "@/services/stokService";
import { supplierService } from "@/services/supplierService";
import { userService } from "@/services/userService";
import {
  auditLogList,
  permissionList,
  returPembelianList,
  roleList,
  suratPesananList
} from "@/lib/erp-mock";
import {
  jenisBarangService,
  lokasiSimpanService,
  pabrikService,
  principalService,
  satuanMasterService
} from "@/services/masterDataService";
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
  create?: (payload: ModuleRecord) => Promise<ModuleRecord | null | void>;
  update?: (id: string, payload: ModuleRecord, record?: ModuleRecord) => Promise<ModuleRecord | null | void>;
  remove?: (id: string) => Promise<unknown>;
  toggleBooleanKey?: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  detailTitleKey?: string;
  allowDetail?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
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
        kode: item.kode,
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
    create: async (payload) => {
      const created = await kategoriService.create({
        kode: String(payload.kode ?? "").trim() || undefined,
        nama: String(payload.nama ?? ""),
        deskripsi: String(payload.deskripsi ?? "").trim() || undefined
      });

      return {
        id: created.id,
        kode: created.kode,
        nama: created.nama,
        deskripsi: created.deskripsi ?? "-",
        updatedAt: created.updatedAt
      };
    },
    update: async (id, payload, record) => {
      const updated = await kategoriService.update(id, {
        kode: String(payload.kode ?? record?.kode ?? "").trim() || undefined,
        nama: String(payload.nama ?? record?.nama ?? ""),
        deskripsi: String(payload.deskripsi ?? "").trim() || undefined
      });

      return updated
        ? {
            id: updated.id,
            kode: updated.kode,
            nama: updated.nama,
            deskripsi: updated.deskripsi ?? "-",
            updatedAt: updated.updatedAt
          }
        : null;
    },
    fields: [
      { name: "kode", label: "Kode Kategori", type: "text" },
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
    create: (payload) =>
      supplierService
        .create({
          nama: String(payload.nama ?? ""),
          kontakPerson: payload.kontakPerson ? String(payload.kontakPerson) : undefined,
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          email: payload.email ? String(payload.email) : undefined,
          npwp: payload.npwp ? String(payload.npwp) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => ({ ...item })),
    update: (id, payload) =>
      supplierService
        .update(id, {
          nama: String(payload.nama ?? ""),
          kontakPerson: payload.kontakPerson ? String(payload.kontakPerson) : undefined,
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          email: payload.email ? String(payload.email) : undefined,
          npwp: payload.npwp ? String(payload.npwp) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => ({ ...item })),
    remove: (id) => supplierService.delete(id),
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true,
    allowDelete: true
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
        kode: item.kode,
        nama: item.nama,
        telepon: item.telepon ?? "",
        email: item.email ?? "",
        jenisKelamin: item.jenisKelamin ?? "",
        tanggalLahir: item.tanggalLahir ?? "",
        catatanAlergi: item.catatanAlergi ?? "",
        alamat: item.alamat ?? "",
        member: item.member,
        aktif: item.aktif
      }));
    },
    create: (payload) =>
      pelangganService
        .create({
          nama: String(payload.nama ?? ""),
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          email: payload.email ? String(payload.email) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          tanggalLahir: payload.tanggalLahir ? String(payload.tanggalLahir) : undefined,
          jenisKelamin:
            payload.jenisKelamin === "L" || payload.jenisKelamin === "P"
              ? payload.jenisKelamin
              : undefined,
          catatanAlergi: payload.catatanAlergi ? String(payload.catatanAlergi) : undefined,
          member: Boolean(payload.member),
          aktif: payload.aktif === undefined ? true : Boolean(payload.aktif)
        })
        .then((item) => ({ ...item })),
    update: (id, payload) =>
      pelangganService
        .update(id, {
          kode: payload.kode ? String(payload.kode) : undefined,
          nama: String(payload.nama ?? ""),
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          email: payload.email ? String(payload.email) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          tanggalLahir: payload.tanggalLahir ? String(payload.tanggalLahir) : undefined,
          jenisKelamin:
            payload.jenisKelamin === "L" || payload.jenisKelamin === "P"
              ? payload.jenisKelamin
              : undefined,
          catatanAlergi: payload.catatanAlergi ? String(payload.catatanAlergi) : undefined,
          member: Boolean(payload.member),
          aktif: payload.aktif === undefined ? true : Boolean(payload.aktif)
        })
        .then((item) => (item ? { ...item } : null)),
    remove: (id) => pelangganService.delete(id),
    columns: [
      { key: "nama", header: "Nama" },
      { key: "telepon", header: "Telepon" },
      { key: "jenisKelamin", header: "JK" },
      { key: "tanggalLahir", header: "Lahir", type: "date" },
      { key: "aktif", header: "Status", type: "boolean" }
    ],
    fields: [
      { name: "nama", label: "Nama", type: "text" },
      { name: "telepon", label: "Telepon", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "tanggalLahir", label: "Tanggal Lahir", type: "date" },
      {
        name: "jenisKelamin",
        label: "Jenis Kelamin",
        type: "select",
        options: [
          { label: "Pilih jenis kelamin", value: "" },
          { label: "Laki-laki", value: "L" },
          { label: "Perempuan", value: "P" }
        ]
      },
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "catatanAlergi", label: "Catatan Alergi", type: "textarea" },
      { name: "member", label: "Member", type: "checkbox", defaultValue: false },
      { name: "aktif", label: "Aktif", type: "checkbox", defaultValue: true }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true,
    allowDelete: true
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
    title: "Riwayat Transaksi",
    description: "Riwayat transaksi penjualan, pembayaran, kembalian, dan status.",
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
      const [alerts, result] = await Promise.all([
        notifikasiService.generateAlerts(),
        notifikasiService.list(LOAD_ALL)
      ]);

      return [...alerts, ...result.data].map((item) => ({
        id: item.id,
        tipe: item.tipe,
        judul: item.judul,
        pesan: item.pesan ?? "-",
        isRead: item.isRead,
        createdAt: item.createdAt
      }));
    },
    columns: [
      { key: "tipe", header: "Tipe", type: "status" },
      { key: "judul", header: "Judul" },
      { key: "pesan", header: "Pesan" },
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
    create: (payload) =>
      golonganService
        .create({
          kode: String(payload.kode ?? ""),
          nama: String(payload.nama ?? ""),
          butuhResep: Boolean(payload.butuhResep),
          butuhSuratPesanan: Boolean(payload.butuhSuratPesanan),
          deskripsi: payload.deskripsi ? String(payload.deskripsi) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => ({ ...item })),
    update: (id, payload, record) =>
      golonganService
        .update(id, {
          kode: String(payload.kode ?? record?.kode ?? ""),
          nama: String(payload.nama ?? record?.nama ?? ""),
          butuhResep: Boolean(payload.butuhResep),
          butuhSuratPesanan: Boolean(payload.butuhSuratPesanan),
          deskripsi: payload.deskripsi ? String(payload.deskripsi) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => (item ? { ...item } : null)),
    remove: (id) => golonganService.delete(id),
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
    allowEdit: true,
    allowDelete: true
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
        email: item.email ?? "-",
        alamat: item.alamat ?? "-",
        aktif: item.aktif
      }));
    },
    create: (payload) =>
      dokterService
        .create({
          kode: String(payload.kode ?? ""),
          nama: String(payload.nama ?? ""),
          nomorSip: payload.nomorSip ? String(payload.nomorSip) : undefined,
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          email: payload.email ? String(payload.email) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => ({ ...item })),
    update: (id, payload, record) =>
      dokterService
        .update(id, {
          kode: String(payload.kode ?? record?.kode ?? ""),
          nama: String(payload.nama ?? record?.nama ?? ""),
          nomorSip: payload.nomorSip ? String(payload.nomorSip) : undefined,
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          email: payload.email ? String(payload.email) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => (item ? { ...item } : null)),
    remove: (id) => dokterService.delete(id),
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
    allowEdit: true,
    allowDelete: true
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
        kota: item.kota ?? "",
        telepon: item.telepon ?? "",
        email: item.email ?? "",
        alamat: item.alamat ?? "",
        provinsi: item.provinsi ?? "",
        kodePos: item.kodePos ?? "",
        aktif: item.aktif
      }));
    },
    create: (payload) =>
      cabangService
        .create({
          kode: payload.kode ? String(payload.kode) : undefined,
          nama: String(payload.nama ?? ""),
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          email: payload.email ? String(payload.email) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          kota: payload.kota ? String(payload.kota) : undefined,
          provinsi: payload.provinsi ? String(payload.provinsi) : undefined,
          kodePos: payload.kodePos ? String(payload.kodePos) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => ({ ...item })),
    update: (id, payload) =>
      cabangService
        .update(id, {
          kode: payload.kode ? String(payload.kode) : undefined,
          nama: String(payload.nama ?? ""),
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          email: payload.email ? String(payload.email) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          kota: payload.kota ? String(payload.kota) : undefined,
          provinsi: payload.provinsi ? String(payload.provinsi) : undefined,
          kodePos: payload.kodePos ? String(payload.kodePos) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => (item ? { ...item } : null)),
    remove: (id) => cabangService.delete(id),
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
    allowEdit: true,
    allowDelete: true
  },
  satuan: {
    key: "satuan",
    title: "Satuan",
    description: "Satuan unit barang: tablet, box, strip, botol.",
    basePath: "/satuan",
    addPath: "/satuan/tambah",
    load: async () => {
      const result = await satuanMasterService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        deskripsi: item.deskripsi,
        aktif: item.aktif
      }));
    },
    create: (payload) =>
      satuanMasterService
        .create({
          kode: String(payload.kode ?? ""),
          nama: String(payload.nama ?? ""),
          deskripsi: payload.deskripsi ? String(payload.deskripsi) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => ({ ...item })),
    update: (id, payload, record) =>
      satuanMasterService
        .update(id, {
          kode: String(payload.kode ?? record?.kode ?? ""),
          nama: String(payload.nama ?? record?.nama ?? ""),
          deskripsi: payload.deskripsi ? String(payload.deskripsi) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => (item ? { ...item } : null)),
    remove: (id) => satuanMasterService.delete(id),
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
    allowEdit: true,
    allowDelete: true
  },
  jenisBarang: {
    key: "jenisBarang",
    title: "Jenis Barang",
    description: "Klasifikasi jenis barang: obat, alkes, BHP, suplemen.",
    basePath: "/jenis-barang",
    addPath: "/jenis-barang/tambah",
    load: async () => {
      const result = await jenisBarangService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        deskripsi: item.deskripsi ?? "-"
      }));
    },
    create: (payload) =>
      jenisBarangService
        .create({
          kode: String(payload.kode ?? ""),
          nama: String(payload.nama ?? ""),
          deskripsi: payload.deskripsi ? String(payload.deskripsi) : undefined,
          aktif: true
        })
        .then((item) => ({ ...item })),
    update: (id, payload, record) =>
      jenisBarangService
        .update(id, {
          kode: String(payload.kode ?? record?.kode ?? ""),
          nama: String(payload.nama ?? record?.nama ?? ""),
          deskripsi: payload.deskripsi ? String(payload.deskripsi) : undefined,
          aktif: true
        })
        .then((item) => (item ? { ...item } : null)),
    remove: (id) => jenisBarangService.delete(id),
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Jenis" },
      { key: "deskripsi", header: "Deskripsi" }
    ],
    fields: [
      { name: "kode", label: "Kode Jenis", type: "text" },
      { name: "nama", label: "Nama Jenis", type: "text" },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true,
    allowDelete: true
  },
  lokasiSimpan: {
    key: "lokasiSimpan",
    title: "Lokasi Simpan",
    description: "Rak dan lemari penyimpanan stok obat.",
    basePath: "/lokasi-simpan",
    addPath: "/lokasi-simpan/tambah",
    load: async () => {
      const result = await lokasiSimpanService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        tipeLokasi: item.tipeLokasi,
        deskripsi: item.deskripsi,
        aktif: item.aktif
      }));
    },
    create: (payload) =>
      lokasiSimpanService
        .create({
          kode: String(payload.kode ?? ""),
          nama: String(payload.nama ?? ""),
          tipeLokasi: payload.tipeLokasi ? String(payload.tipeLokasi) : undefined,
          deskripsi: payload.deskripsi ? String(payload.deskripsi) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => ({ ...item })),
    update: (id, payload) =>
      lokasiSimpanService
        .update(id, {
          kode: String(payload.kode ?? ""),
          nama: String(payload.nama ?? ""),
          tipeLokasi: payload.tipeLokasi ? String(payload.tipeLokasi) : undefined,
          deskripsi: payload.deskripsi ? String(payload.deskripsi) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => (item ? { ...item } : null)),
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
    allowEdit: true,
    allowDelete: true,
    remove: (id) => lokasiSimpanService.delete(id)
  },
  pabrik: {
    key: "pabrik",
    title: "Pabrik",
    description: "Produsen/manufaktur obat.",
    basePath: "/pabrik",
    addPath: "/pabrik/tambah",
    load: async () => {
      const result = await pabrikService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        telepon: item.telepon ?? "-",
        alamat: item.alamat ?? "-"
      }));
    },
    create: (payload) =>
      pabrikService
        .create({
          kode: String(payload.kode ?? ""),
          nama: String(payload.nama ?? ""),
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          aktif: true
        })
        .then((item) => ({ ...item })),
    update: (id, payload, record) =>
      pabrikService
        .update(id, {
          kode: String(payload.kode ?? record?.kode ?? ""),
          nama: String(payload.nama ?? record?.nama ?? ""),
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          aktif: true
        })
        .then((item) => (item ? { ...item } : null)),
    remove: (id) => pabrikService.delete(id),
    columns: [
      { key: "kode", header: "Kode" },
      { key: "nama", header: "Pabrik" },
      { key: "telepon", header: "Telepon" }
    ],
    fields: [
      { name: "kode", label: "Kode Pabrik", type: "text" },
      { name: "nama", label: "Nama Pabrik", type: "text" },
      { name: "telepon", label: "Telepon", type: "text" },
      { name: "alamat", label: "Alamat", type: "textarea" }
    ],
    detailTitleKey: "nama",
    allowDetail: true,
    allowEdit: true,
    allowDelete: true
  },
  principal: {
    key: "principal",
    title: "Principal / Distributor",
    description: "Distributor resmi (PBF) sumber pengadaan obat.",
    basePath: "/principal",
    addPath: "/principal/tambah",
    load: async () => {
      const result = await principalService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        telepon: item.telepon,
        alamat: item.alamat,
        aktif: item.aktif
      }));
    },
    create: (payload) =>
      principalService
        .create({
          kode: String(payload.kode ?? ""),
          nama: String(payload.nama ?? ""),
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => ({ ...item })),
    update: (id, payload) =>
      principalService
        .update(id, {
          kode: String(payload.kode ?? ""),
          nama: String(payload.nama ?? ""),
          telepon: payload.telepon ? String(payload.telepon) : undefined,
          alamat: payload.alamat ? String(payload.alamat) : undefined,
          aktif: Boolean(payload.aktif)
        })
        .then((item) => (item ? { ...item } : null)),
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
    allowEdit: true,
    allowDelete: true,
    remove: (id) => principalService.delete(id)
  },
  akun: {
    key: "akun",
    title: "Akun (Chart of Accounts)",
    description: "Daftar akun buku besar untuk pencatatan akuntansi.",
    basePath: "/akun",
    addPath: "/akun/tambah",
    load: async () => {
      const result = await akunService.list(LOAD_ALL);
      return result.data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        tipe: item.tipe,
        aktif: item.aktif
      }));
    },
    create: (payload) =>
      akunService
        .create({
          kode: String(payload.kode ?? ""),
          nama: String(payload.nama ?? ""),
          tipe: String(payload.tipe ?? ""),
          aktif: payload.aktif === undefined ? true : Boolean(payload.aktif)
        })
        .then((item) => ({ ...item })),
    update: (id, payload, record) =>
      akunService
        .update(id, {
          kode: String(payload.kode ?? record?.kode ?? ""),
          nama: String(payload.nama ?? record?.nama ?? ""),
          tipe: String(payload.tipe ?? record?.tipe ?? ""),
          aktif: payload.aktif === undefined ? Boolean(record?.aktif) : Boolean(payload.aktif)
        })
        .then((item) => (item ? { ...item } : null)),
    remove: (id) => akunService.delete(id),
    toggleBooleanKey: "aktif",
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
    allowEdit: true,
    allowDelete: true
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



