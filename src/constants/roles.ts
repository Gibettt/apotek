import type { Role, RoleName } from "@/types";

export const roles: Role[] = [
  {
    id: "role-owner",
    kode: "owner",
    nama: "Owner",
    deskripsi: "Akses penuh laporan, user, dan pengaturan apotek"
  },
  {
    id: "role-admin",
    kode: "admin",
    nama: "Admin",
    deskripsi: "Mengelola master data, pembelian, stok, dan laporan"
  },
  {
    id: "role-apoteker",
    kode: "apoteker",
    nama: "Apoteker",
    deskripsi: "Mengelola obat, stok, resep, opname, dan verifikasi"
  },
  {
    id: "role-kasir",
    kode: "kasir",
    nama: "Kasir",
    deskripsi: "Menjalankan transaksi POS dan melihat riwayat transaksi"
  }
];

export const roleLabels: Record<RoleName, string> = {
  owner: "Owner",
  admin: "Admin",
  apoteker: "Apoteker",
  kasir: "Kasir"
};

export const allRoles: RoleName[] = ["owner", "admin", "apoteker", "kasir"];
