"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Clock3,
  ExternalLink,
  Search,
  Settings,
  Sun
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifikasi } from "@/hooks/useNotifikasi";
import { cn } from "@/utils/cn";

const topItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Kasir", href: "/penjualan/kasir" },
  { label: "Stok Obat", href: "/obat" },
  { label: "Supplier", href: "/supplier" },
  { label: "Laporan", href: "/laporan/penjualan" }
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifikasi();
  const notifications = unreadCount();

  return (
    <header className="sticky top-0 z-30 bg-[#f4f3ef]/90 px-4 py-4 backdrop-blur lg:px-6 lg:py-5 2xl:px-8">
      <div className="flex min-w-0 items-center gap-2 xl:gap-3 2xl:gap-4">
        <Link
          href="/dashboard"
          className="flex h-[52px] shrink-0 items-center gap-2 rounded-full bg-white px-2.5 py-2 pr-3 shadow-[0_16px_50px_rgba(25,24,21,.08)] xl:gap-3 xl:pr-4 2xl:h-14 2xl:pr-5"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ff6a3d] text-white shadow-[0_12px_30px_rgba(255,106,61,.26)]">
            <ExternalLink className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="max-w-[122px] truncate whitespace-nowrap text-sm font-black text-stone-950 2xl:max-w-none">
            Apotek Ananda
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 justify-center md:flex">
          <div className="flex rounded-full bg-white p-1.5 shadow-[0_16px_50px_rgba(25,24,21,.08)]">
            {topItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3.5 py-3 text-[13px] font-bold text-stone-500 transition hover:text-stone-950 xl:px-4 xl:text-sm 2xl:px-6",
                    active && "bg-[#20201d] text-white shadow-sm hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 xl:gap-3">
          <div className="hidden items-center rounded-full bg-white p-1.5 shadow-[0_16px_50px_rgba(25,24,21,.08)] sm:flex 2xl:p-2">
            <button
              type="button"
              aria-label="Cari"
              className="grid h-9 w-9 place-items-center rounded-full text-stone-600 transition hover:bg-[#f4f3ef] hover:text-stone-950 2xl:h-10 2xl:w-10"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </button>
            <Link
              href="/notifikasi"
              aria-label="Notifikasi"
              className="relative grid h-9 w-9 place-items-center rounded-full text-stone-600 transition hover:bg-[#f4f3ef] hover:text-stone-950 2xl:h-10 2xl:w-10"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />
              {notifications ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ff6a3d] ring-2 ring-white" />
              ) : null}
            </Link>
            <button
              type="button"
              aria-label="Aktivitas"
              className="grid h-9 w-9 place-items-center rounded-full text-stone-600 transition hover:bg-[#f4f3ef] hover:text-stone-950 2xl:h-10 2xl:w-10"
            >
              <Clock3 className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </button>
          </div>
          <button
            type="button"
            aria-label="Tema"
            className="hidden h-11 w-11 place-items-center rounded-full bg-white text-[#ff6a3d] shadow-[0_16px_50px_rgba(25,24,21,.08)] transition hover:-translate-y-0.5 sm:grid 2xl:h-11 2xl:w-11"
          >
            <Sun className="h-5 w-5" strokeWidth={1.9} />
          </button>
          <Link
            href="/pengaturan/profil"
            className="hidden h-12 items-center gap-2 rounded-full bg-white px-2 py-1.5 pr-2.5 shadow-[0_16px_50px_rgba(25,24,21,.08)] sm:flex 2xl:h-14 2xl:gap-3 2xl:px-3 2xl:py-2 2xl:pr-4"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#8c5c45] text-[11px] font-black text-white 2xl:h-11 2xl:w-11 2xl:text-sm">
              PA
            </span>
            <span className="hidden min-w-0 leading-tight lg:block">
              <span className="block max-w-[84px] truncate whitespace-nowrap text-xs font-black leading-none text-stone-950 2xl:max-w-[100px] 2xl:text-sm">
                {user?.name || "Pemilik Apotek"}
              </span>
              <span className="mt-1 block max-w-[84px] truncate whitespace-nowrap text-[10px] font-semibold leading-none text-stone-400 2xl:max-w-[100px] 2xl:text-xs">
                Admin Utama
              </span>
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-stone-500 lg:block 2xl:h-4 2xl:w-4" />
          </Link>
          <Link
            href="/pengaturan/profil"
            aria-label="Pengaturan"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-stone-600 shadow-[0_16px_50px_rgba(25,24,21,.08)] transition hover:text-stone-950 sm:hidden"
          >
            <Settings className="h-5 w-5" strokeWidth={1.9} />
          </Link>
        </div>
      </div>

      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
        {topItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-500 shadow-sm",
                active && "bg-[#20201d] text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
