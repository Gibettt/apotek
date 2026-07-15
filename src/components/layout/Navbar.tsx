"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Building2, ChevronDown, ChevronRight, HelpCircle, Search, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCabang } from "@/hooks/useCabang";
import { useNotifikasi } from "@/hooks/useNotifikasi";
import { cn } from "@/utils/cn";

const mobileItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Kasir", href: "/penjualan/kasir" },
  { label: "Obat", href: "/obat" },
  { label: "Resep", href: "/resep" },
  { label: "Laporan", href: "/laporan/penjualan" }
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifikasi();
  const { activeCabangId, availableCabang, isAllBranches, setActiveCabang } = useCabang();
  const notifications = unreadCount();
  const currentPage = pathname === "/dashboard" ? "Overview" : pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") ?? "Overview";
  const showAllBranchesOption = user?.role === "owner";

  return (
    <header className="dashboard-navbar sticky top-0 z-30">
      <div className="flex min-w-0 items-center gap-3 px-4 py-3.5 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Link href="/dashboard" className="font-semibold text-stone-900">Dashboard</Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" strokeWidth={1.7} />
          <span className="truncate capitalize text-stone-500">{currentPage}</span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {availableCabang.length > 0 && (
            <label className="dashboard-filter hidden sm:inline-flex" aria-label="Pilih cabang">
              <Building2 className="h-3.5 w-3.5" strokeWidth={1.7} />
              <select
                value={isAllBranches ? "__all__" : activeCabangId ?? ""}
                onChange={(event) =>
                  setActiveCabang(event.target.value === "__all__" ? null : event.target.value)
                }
              >
                {showAllBranchesOption && <option value="__all__">Semua cabang</option>}
                {availableCabang.map((cabang) => (
                  <option key={cabang.id} value={cabang.id}>
                    {cabang.nama}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.7} />
            </label>
          )}
          <button type="button" aria-label="Cari" className="dashboard-top-action"><Search className="h-4 w-4" strokeWidth={1.8} /></button>
          <Link href="/notifikasi" aria-label="Notifikasi" className="dashboard-top-action relative"><Bell className="h-4 w-4" strokeWidth={1.8} />{notifications ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#2f9b7f]" /> : null}</Link>
          <Link href="/pengaturan/profil" aria-label="Bantuan" className="hidden items-center gap-1.5 px-2 text-sm font-medium text-stone-500 sm:flex"><HelpCircle className="h-4 w-4" strokeWidth={1.7} /> Bantuan</Link>
          <Link href="/pengaturan/profil" aria-label="Profil pengguna" className="ml-1 flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-1.5 transition hover:border-stone-300"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e5f3ed] text-[10px] font-bold text-[#267d6b]">{(user?.name || "Pemilik Apotek").split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><span className="hidden max-w-28 truncate text-xs font-medium text-stone-700 xl:block">{user?.name || "Pemilik Apotek"}</span></Link>
          <Link href="/pengaturan/profil" aria-label="Pengaturan" className="dashboard-top-action sm:hidden"><Settings className="h-4 w-4" strokeWidth={1.8} /></Link>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t border-stone-100 px-4 py-2 lg:hidden">
        {mobileItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return <Link key={item.href} href={item.href} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500", active && "bg-[#e8f4ef] text-[#267d6b]")}>{item.label}</Link>;
        })}
      </nav>
    </header>
  );
}
