import type { Role, RoleName } from "@/types";

export const roles: Role[] = [
  {
    id: 1,
    name: "owner",
    label: "Owner",
    description: "Akses penuh laporan, user, dan pengaturan apotek"
  },
  {
    id: 2,
    name: "admin",
    label: "Admin",
    description: "Mengelola master data, pembelian, stok, dan laporan"
  },
  {
    id: 3,
    name: "apoteker",
    label: "Apoteker",
    description: "Mengelola obat, stok, resep, opname, dan verifikasi"
  },
  {
    id: 4,
    name: "kasir",
    label: "Kasir",
    description: "Menjalankan transaksi POS dan melihat riwayat transaksi"
  }
];

export const roleLabels: Record<RoleName, string> = {
  owner: "Owner",
  admin: "Admin",
  apoteker: "Apoteker",
  kasir: "Kasir"
};

export const allRoles: RoleName[] = ["owner", "admin", "apoteker", "kasir"];
