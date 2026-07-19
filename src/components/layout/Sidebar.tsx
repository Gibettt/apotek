"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  PanelLeftClose,
  PanelLeftOpen,
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
import { cn } from "@/utils/cn";

const menuGroups = [
  {
    label: "Operasional",
    items: [
      { label: "Penjualan", href: "/penjualan/kasir", icon: ShoppingCart },
      { label: "Riwayat Transaksi", href: "/penjualan", icon: ReceiptText },
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
      { label: "Obat", href: "/obat", icon: Pill },
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

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleLabel = isCollapsed ? "Buka sidebar" : "Tutup sidebar";

  return (
    <aside
      aria-label="Navigasi aplikasi"
      className={cn("dashboard-sidebar sticky top-5 hidden h-[calc(100dvh-40px)] shrink-0 overflow-hidden lg:flex", isCollapsed && "dashboard-sidebar-collapsed")}
    >
      <div className="dashboard-menu-panel w-full min-w-0">
        <div className="dashboard-sidebar-header">
          <Link href="/dashboard" className="dashboard-sidebar-brand" tabIndex={isCollapsed ? -1 : undefined}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e5f3ed] text-[#267d6b]">
              <Pill className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="dashboard-sidebar-label truncate text-sm font-semibold text-stone-900">Apotek Ananda</span>
          </Link>
          <button
            type="button"
            aria-controls="dashboard-navigation"
            aria-expanded={!isCollapsed}
            aria-label={toggleLabel}
            className="dashboard-sidebar-toggle"
            onClick={() => setIsCollapsed((current) => !current)}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" strokeWidth={1.8} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={1.8} />}
          </button>
        </div>

        <nav id="dashboard-navigation" className="dashboard-menu-scroll" aria-label="Navigasi utama">
          <Link href="/dashboard" title="Overview" className={cn("dashboard-menu-link", pathname === "/dashboard" && "dashboard-menu-link-active")}>
            <LayoutDashboard className="h-4 w-4" strokeWidth={1.8} />
            <span className="dashboard-sidebar-label">Overview</span>
          </Link>
          {menuGroups.map((group) => (
            <div key={group.label} className="dashboard-menu-group">
              <p className="dashboard-sidebar-group-label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link key={item.href} href={item.href} title={item.label} className={cn("dashboard-menu-link", active && "dashboard-menu-link-active")}>
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                    <span className="dashboard-sidebar-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-stone-100 p-2">
          <Link href="/pengaturan/profil" title="Bantuan" className="dashboard-menu-link">
            <CircleHelp className="h-4 w-4" strokeWidth={1.8} />
            <span className="dashboard-sidebar-label">Bantuan</span>
          </Link>
          <button type="button" title="Keluar" className="dashboard-menu-link w-full">
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            <span className="dashboard-sidebar-label">Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
