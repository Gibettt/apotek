import type { RoleName } from "@/types";

export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  roles: RoleName[];
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const menuGroups: MenuGroup[] = [
  {
    label: "Utama",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard",
        roles: ["owner", "admin", "apoteker", "kasir"]
      },
      {
        label: "Penjualan",
        href: "/penjualan/kasir",
        icon: "ShoppingCart",
        roles: ["kasir", "admin", "owner"]
      },
      {
        label: "Notifikasi",
        href: "/notifikasi",
        icon: "Bell",
        roles: ["owner", "admin", "apoteker", "kasir"]
      }
    ]
  },
  {
    label: "Master Data",
    items: [
      {
        label: "Obat",
        href: "/obat",
        icon: "Pill",
        roles: ["owner", "admin", "apoteker", "kasir"]
      },
      {
        label: "Kategori",
        href: "/kategori",
        icon: "Tags",
        roles: ["owner", "admin"]
      },
      {
        label: "Supplier",
        href: "/supplier",
        icon: "Truck",
        roles: ["owner", "admin"]
      },
      {
        label: "Pelanggan",
        href: "/pelanggan",
        icon: "Users",
        roles: ["owner", "admin", "kasir"]
      }
    ]
  },
  {
    label: "Operasional",
    items: [
      {
        label: "Stok",
        href: "/stok",
        icon: "Boxes",
        roles: ["owner", "admin", "apoteker", "kasir"]
      },
      {
        label: "Pembelian",
        href: "/pembelian",
        icon: "PackagePlus",
        roles: ["owner", "admin"]
      },
      {
        label: "Riwayat Transaksi",
        href: "/penjualan",
        icon: "ReceiptText",
        roles: ["owner", "admin", "kasir"]
      },
      {
        label: "Resep",
        href: "/resep",
        icon: "ClipboardCheck",
        roles: ["owner", "admin", "apoteker"]
      }
    ]
  },
  {
    label: "Manajemen",
    items: [
      {
        label: "Laporan",
        href: "/laporan/penjualan",
        icon: "ChartColumn",
        roles: ["owner", "admin"]
      },
      {
        label: "Users",
        href: "/users",
        icon: "UserCog",
        roles: ["owner"]
      },
      {
        label: "Pengaturan",
        href: "/pengaturan/profil",
        icon: "Settings",
        roles: ["owner", "admin"]
      }
    ]
  }
];
