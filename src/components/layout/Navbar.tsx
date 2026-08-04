"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Building2,
  CalendarClock,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Info,
  PackageX,
  Search,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCabang } from "@/hooks/useCabang";
import { useNotifikasi } from "@/hooks/useNotifikasi";
import { resolveEffectiveRole, roleLabels } from "@/constants/roles";
import type { TipeNotifikasi } from "@/types";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/formatDate";

const mobileItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Penjualan", href: "/penjualan" },
  { label: "Obat", href: "/obat" },
  { label: "Resep", href: "/resep" },
  { label: "Laporan", href: "/laporan/penjualan" }
];

function resolvePageLabel(pathname: string) {
  if (pathname === "/penjualan" || pathname.startsWith("/penjualan/")) {
    return "Penjualan";
  }

  if (pathname.startsWith("/retur-penjualan")) {
    return "Penjualan";
  }

  return pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") ?? "Overview";
}

function greetingForHour(hour: number) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

function notifikasiIcon(tipe: TipeNotifikasi) {
  if (tipe === "stok_menipis") return PackageX;
  if (tipe === "obat_expired") return CalendarClock;
  return Info;
}

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { items, unreadCount, loadAlerts, markAsRead, markAllAsRead } = useNotifikasi();
  const { activeCabangId, availableCabang, isAllBranches, setActiveCabang } = useCabang();
  const isDashboard = pathname === "/dashboard";
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts, activeCabangId]);

  useEffect(() => {
    if (!notifOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setNotifOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notifOpen]);

  const notifications = unreadCount();
  const previewNotifications = [...items]
    .sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 8);
  const currentPage = isDashboard ? "Overview" : resolvePageLabel(pathname);
  const effectiveRole = user ? resolveEffectiveRole(user.role, user.email) : "admin";
  const showAllBranchesOption = effectiveRole === "owner";
  const profileLabel = roleLabels[effectiveRole];
  const profileInitials = profileLabel
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="dashboard-navbar sticky top-0 z-30">
      <div className="flex min-w-0 items-center gap-3 px-4 py-3.5 lg:px-6">
        {isDashboard ? (
          <p className="min-w-0 truncate text-[15px] font-semibold text-stone-900">
            <span aria-hidden="true">👋</span> {greetingForHour(new Date().getHours())}, {profileLabel}!
          </p>
        ) : (
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Link href="/dashboard" className="font-semibold text-stone-900">Dashboard</Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" strokeWidth={1.7} />
            <span className="truncate capitalize text-stone-500">{currentPage}</span>
          </div>
        )}
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
          <button type="button" aria-label="Cari" className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-400 transition hover:border-stone-300 sm:inline-flex">
            <Search className="h-3.5 w-3.5" strokeWidth={1.8} /> Cari...
            <kbd className="ml-3 rounded-md bg-stone-100 px-1.5 py-0.5 font-sans text-[10px] text-stone-400">⌘F</kbd>
          </button>
          <button type="button" aria-label="Cari" className="dashboard-top-action !rounded-full sm:hidden"><Search className="h-4 w-4" strokeWidth={1.8} /></button>
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label="Notifikasi"
              aria-expanded={notifOpen}
              onClick={() => setNotifOpen((open) => !open)}
              className={cn(
                "dashboard-top-action !rounded-full relative",
                notifications > 0 && "dashboard-top-action-alert"
              )}
            >
              <Bell className="h-4 w-4" strokeWidth={1.8} />
              {notifications ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-600" /> : null}
            </button>
            {notifOpen && (
              <div className="dashboard-notif-dropdown">
                <div className="dashboard-notif-dropdown-header">
                  <p className="text-sm font-semibold text-stone-800">Notifikasi</p>
                  {notifications > 0 && (
                    <button type="button" onClick={markAllAsRead} className="dashboard-notif-mark-all">
                      <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.8} /> Tandai semua dibaca
                    </button>
                  )}
                </div>
                <div className="dashboard-notif-dropdown-list">
                  {previewNotifications.length === 0 ? (
                    <p className="dashboard-notif-empty">Tidak ada notifikasi.</p>
                  ) : (
                    previewNotifications.map((item) => {
                      const Icon = notifikasiIcon(item.tipe);
                      return (
                        <Link
                          key={item.id}
                          href="/notifikasi"
                          onClick={() => {
                            markAsRead(item.id);
                            setNotifOpen(false);
                          }}
                          className={cn("dashboard-notif-item", !item.isRead && "dashboard-notif-item-unread")}
                        >
                          <span className={cn("dashboard-notif-item-icon", `dashboard-notif-item-icon-${item.tipe}`)}>
                            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-xs font-semibold text-stone-800">{item.judul}</span>
                            {item.pesan && <span className="block truncate text-xs text-stone-500">{item.pesan}</span>}
                            <span className="block text-[11px] text-stone-400">{formatDateTime(item.createdAt)}</span>
                          </span>
                          {!item.isRead && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2f9b7f]" />}
                        </Link>
                      );
                    })
                  )}
                </div>
                <Link href="/notifikasi" onClick={() => setNotifOpen(false)} className="dashboard-notif-dropdown-footer">
                  Lihat semua notifikasi
                </Link>
              </div>
            )}
          </div>
          <Link href="/pengaturan/profil" aria-label="Bantuan" className="hidden items-center gap-1.5 px-2 text-sm font-medium text-stone-500 sm:flex"><HelpCircle className="h-4 w-4" strokeWidth={1.7} /> Bantuan</Link>
          <Link href="/pengaturan/profil" aria-label="Profil pengguna" className="ml-1 flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1.5 transition hover:border-stone-300"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e5f3ed] text-[10px] font-bold text-[#267d6b]">{profileInitials}</span><span className="hidden max-w-28 truncate text-xs font-medium text-stone-700 xl:block">{profileLabel}</span></Link>
          <Link href="/pengaturan/profil" aria-label="Pengaturan" className="dashboard-top-action !rounded-full sm:hidden"><Settings className="h-4 w-4" strokeWidth={1.8} /></Link>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t border-stone-100 px-4 py-2 lg:hidden">
        {mobileItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
            (item.href === "/penjualan" && pathname.startsWith("/retur-penjualan"));
          return <Link key={item.href} href={item.href} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500", active && "bg-[#e8f4ef] text-[#267d6b]")}>{item.label}</Link>;
        })}
      </nav>
    </header>
  );
}
