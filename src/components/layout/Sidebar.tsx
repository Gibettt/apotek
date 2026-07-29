"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  BookText,
  Boxes,
  Building2,
  CircleHelp,
  ClipboardList,
  Coins,
  Factory,
  FileText,
  Key,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Pill,
  ReceiptText,
  Ruler,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Tag,
  Truck,
  Undo2,
  UserCog,
  Users,
  Wallet
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/utils/cn";

const menuGroups = [
  {
    label: "Operasional",
    items: [
      { label: "Penjualan", href: "/penjualan/kasir", icon: ShoppingCart },
      { label: "Riwayat Transaksi", href: "/penjualan", icon: ReceiptText },
      { label: "Retur Penjualan", href: "/retur-penjualan", icon: Undo2 },
      { label: "Pembelian", href: "/pembelian", icon: Package },
      { label: "Resep", href: "/resep", icon: ClipboardList },
      { label: "Stok", href: "/stok", icon: Boxes }
    ]
  },
  {
    label: "Pembelian",
    items: [
      { label: "Surat Pesanan", href: "/surat-pesanan", icon: ScrollText },
      { label: "Retur Pembelian", href: "/retur", icon: Undo2 }
    ]
  },
  {
    label: "Master Data",
    items: [
      { label: "Barang", href: "/obat", icon: Pill },
      { label: "Kategori", href: "/kategori", icon: Tag },
      { label: "Golongan Obat", href: "/golongan", icon: ShieldCheck },
      { label: "Jenis Barang", href: "/jenis-barang", icon: Boxes },
      { label: "Satuan", href: "/satuan", icon: Ruler },
      { label: "Lokasi Simpan", href: "/lokasi-simpan", icon: MapPin },
      { label: "Pabrik", href: "/pabrik", icon: Factory },
      { label: "Principal", href: "/principal", icon: Building2 },
      { label: "Supplier", href: "/supplier", icon: Truck },
      { label: "Pelanggan", href: "/pelanggan", icon: Users },
      { label: "Dokter", href: "/dokter", icon: Stethoscope },
      { label: "Cabang", href: "/cabang", icon: Building2 }
    ]
  },
  {
    label: "Keuangan",
    items: [
      { label: "Akun (CoA)", href: "/akun", icon: Wallet },
      { label: "Jurnal Umum", href: "/jurnal", icon: BookText },
      { label: "Biaya Operasional", href: "/biaya", icon: Coins }
    ]
  },
  {
    label: "Laporan",
    items: [
      { label: "Penjualan", href: "/laporan/penjualan", icon: BarChart3 },
      { label: "Stok", href: "/laporan/stok", icon: Boxes },
      { label: "Notifikasi", href: "/notifikasi", icon: Bell }
    ]
  },
  {
    label: "Manajemen",
    items: [
      { label: "Users", href: "/users", icon: UserCog },
      { label: "Role", href: "/role", icon: ShieldCheck },
      { label: "Permission", href: "/permission", icon: Key },
      { label: "Audit Log", href: "/audit-log", icon: FileText },
      { label: "Profil apotek", href: "/pengaturan/profil", icon: Settings }
    ]
  }
];

const menuItems = menuGroups.flatMap((group) => group.items);

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const isActive = (href: string) => {
    if (pathname === href) {
      return true;
    }

    if (!pathname.startsWith(`${href}/`)) {
      return false;
    }

    return !menuItems.some((item) => item.href !== href && item.href.startsWith(`${href}/`) && pathname.startsWith(item.href));
  };

  async function handleLogoutConfirm() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside
      aria-label="Navigasi aplikasi"
      className="dashboard-sidebar dashboard-sidebar-collapsed sticky top-5 hidden h-[calc(100dvh-40px)] shrink-0 overflow-hidden lg:flex"
    >
      <div className="dashboard-menu-panel w-full min-w-0">
        <nav id="dashboard-navigation" className="dashboard-menu-scroll" aria-label="Navigasi utama">
          <Link href="/dashboard" title="Overview" className={cn("dashboard-menu-link", isActive("/dashboard") && "dashboard-menu-link-active")}>
            <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="dashboard-sidebar-label">Overview</span>
          </Link>
          {menuGroups.map((group) => (
            <div key={group.label} className="dashboard-menu-group">
              <p className="dashboard-sidebar-group-label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link key={item.href} href={item.href} title={item.label} className={cn("dashboard-menu-link", active && "dashboard-menu-link-active")}>
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    <span className="dashboard-sidebar-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-stone-100 p-2">
          <Link href="/pengaturan/profil" title="Bantuan" className="dashboard-menu-link">
            <CircleHelp className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="dashboard-sidebar-label">Bantuan</span>
          </Link>
          <button type="button" title="Keluar" className="dashboard-menu-link w-full" onClick={() => setLogoutOpen(true)}>
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="dashboard-sidebar-label">Keluar</span>
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        title="Keluar dari dashboard?"
        description="Sesi Anda akan diakhiri dan Anda harus login lagi untuk masuk ke dashboard."
        confirmText="Ya, logout"
        onConfirm={handleLogoutConfirm}
        onClose={() => setLogoutOpen(false)}
      />
    </aside>
  );
}
