"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  Lock,
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
const ownerOnlyHrefs = new Set([
  "/pembelian",
  "/surat-pesanan",
  "/retur",
  "/akun",
  "/jurnal",
  "/biaya",
  "/stok",
  "/laporan/penjualan",
  "/laporan/stok",
  "/users",
  "/role",
  "/permission",
  "/audit-log",
  "/pengaturan/profil"
]);

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const canViewOwnerOnly = user?.email.trim().toLowerCase() === "owner@gmail.com";

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

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
          <Link
            href="/dashboard"
            title="Overview"
            onClick={() => setPendingHref("/dashboard")}
            className={cn("dashboard-menu-link", isActive("/dashboard") && "dashboard-menu-link-active", pendingHref === "/dashboard" && "pointer-events-none opacity-70")}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="dashboard-sidebar-label">Overview</span>
            {pendingHref === "/dashboard" ? <span className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-[#b9d8cf] border-t-[#0f766e]" /> : null}
          </Link>
          {menuGroups.map((group) => (
            <div key={group.label} className="dashboard-menu-group">
              <p className="dashboard-sidebar-group-label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const locked = ownerOnlyHrefs.has(item.href) && !canViewOwnerOnly;

                if (locked) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      aria-label={`${item.label} terkunci`}
                      title="Khusus Owner"
                      className="dashboard-menu-link w-full cursor-not-allowed opacity-55"
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                      <span className="dashboard-sidebar-label">{item.label}</span>
                      <Lock className="ml-auto h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    onClick={() => setPendingHref(item.href)}
                    className={cn("dashboard-menu-link", active && "dashboard-menu-link-active", pendingHref === item.href && "pointer-events-none opacity-70")}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    <span className="dashboard-sidebar-label">{item.label}</span>
                    {pendingHref === item.href ? <span className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-[#b9d8cf] border-t-[#0f766e]" /> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-stone-100 p-2">
          {canViewOwnerOnly ? (
            <Link
              href="/pengaturan/profil"
              title="Bantuan"
              onClick={() => setPendingHref("/pengaturan/profil")}
              className={cn("dashboard-menu-link", pendingHref === "/pengaturan/profil" && "pointer-events-none opacity-70")}
            >
              <CircleHelp className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <span className="dashboard-sidebar-label">Bantuan</span>
              {pendingHref === "/pengaturan/profil" ? <span className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-[#b9d8cf] border-t-[#0f766e]" /> : null}
            </Link>
          ) : (
            <button
              type="button"
              aria-label="Bantuan terkunci"
              title="Khusus Owner"
              className="dashboard-menu-link w-full cursor-not-allowed opacity-55"
            >
              <CircleHelp className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <span className="dashboard-sidebar-label">Bantuan</span>
              <Lock className="ml-auto h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            </button>
          )}
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
