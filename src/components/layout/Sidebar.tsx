"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Truck
} from "lucide-react";
import { cn } from "@/utils/cn";

const railItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Kasir", href: "/penjualan/kasir", icon: ShoppingCart },
  { label: "Stok Obat", href: "/obat", icon: Boxes },
  { label: "Supplier", href: "/supplier", icon: Truck },
  { label: "Pembelian", href: "/pembelian", icon: Package },
  { label: "Resep", href: "/resep", icon: ClipboardList },
  { label: "Laporan", href: "/laporan/penjualan", icon: BarChart3 },
  { label: "Notifikasi", href: "/notifikasi", icon: Bell },
  { label: "Pengaturan", href: "/pengaturan/profil", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 overflow-y-auto bg-[#f4f3ef] px-4 py-5 transition-[width] duration-300 ease-out lg:flex lg:flex-col",
        collapsed ? "w-[84px] items-center px-3" : "w-[248px]"
      )}
    >
      <div
        className={cn(
          "flex w-full items-center gap-2",
          collapsed ? "justify-center" : "justify-start"
        )}
      >
        <button
          type="button"
          aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          onClick={() => setCollapsed((value) => !value)}
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center bg-white text-stone-500 shadow-[0_18px_42px_rgba(25,24,21,.08)] transition hover:-translate-y-0.5 hover:text-stone-950",
            collapsed ? "h-12 w-14 rounded-[22px]" : "rounded-lg"
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-5 w-5" strokeWidth={1.9} />
          ) : (
            <ChevronsLeft className="h-5 w-5" strokeWidth={1.9} />
          )}
        </button>
      </div>

      <nav
        className={cn(
          "mt-5 flex w-full flex-col gap-1.5 rounded-lg bg-white p-2 shadow-[0_20px_60px_rgba(25,24,21,.08)] transition-all duration-300",
          collapsed && "mt-4 w-14 items-center gap-1.5 rounded-[28px] px-2 py-2"
        )}
      >
        {railItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold text-stone-500 transition hover:-translate-y-0.5 hover:bg-[#f4f3ef] hover:text-stone-950",
                collapsed && "h-10 w-10 justify-center gap-0 rounded-full px-0",
                active && "bg-[#20201d] text-white shadow-[0_14px_30px_rgba(25,24,21,.18)]"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.9} />
              <span
                className={cn(
                  "truncate transition-all duration-300",
                  collapsed ? "w-0 opacity-0" : "w-32 opacity-100"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {collapsed ? (
          <>
            <span className="my-1 h-px w-7 rounded-full bg-stone-200" />
            <Link
              href="/pengaturan/profil"
              title="Bantuan"
              aria-label="Bantuan"
              className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-stone-500 transition hover:bg-[#f4f3ef] hover:text-stone-950"
            >
              ?
            </Link>
            <button
              type="button"
              title="Keluar"
              aria-label="Keluar"
              className="grid h-10 w-10 place-items-center rounded-full text-stone-500 transition hover:bg-[#f4f3ef] hover:text-stone-950"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.9} />
            </button>
          </>
        ) : null}
      </nav>

      <div
        className={cn(
          "mt-4 flex w-full flex-col gap-1.5 rounded-lg bg-white p-2 shadow-[0_20px_60px_rgba(25,24,21,.08)] transition-all duration-300",
          collapsed && "hidden"
        )}
      >
        <Link
          href="/pengaturan/profil"
          title="Bantuan"
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-bold text-stone-500 transition hover:bg-[#f4f3ef] hover:text-stone-950",
            collapsed && "h-9 w-9 justify-center gap-0 rounded-full px-0"
          )}
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center text-base leading-none">
            ?
          </span>
          <span
            className={cn(
              "truncate transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-32 opacity-100"
            )}
          >
            Bantuan
          </span>
        </Link>
        <button
          type="button"
          title="Keluar"
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg px-3 text-left text-sm font-bold text-stone-500 transition hover:bg-[#f4f3ef] hover:text-stone-950",
            collapsed && "h-9 w-9 justify-center gap-0 rounded-full px-0"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.9} />
          <span
            className={cn(
              "truncate transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-32 opacity-100"
            )}
          >
            Keluar
          </span>
        </button>
      </div>
    </aside>
  );
}
