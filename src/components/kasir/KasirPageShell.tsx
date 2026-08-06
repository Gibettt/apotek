"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Clock, LogOut, Menu, ReceiptText, RotateCcw, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

type KasirSection = "kasir" | "riwayat" | "retur";

function formatShiftTime() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());
}

export function KasirPageShell({
  active,
  children
}: {
  active: KasirSection;
  children: ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const updateClock = () => setClock(formatShiftTime());
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const navItems = [
    { key: "kasir", href: "/penjualan/kasir", label: "Kasir", icon: Menu },
    { key: "riwayat", href: "/penjualan", label: "Riwayat Penjualan", icon: ReceiptText },
    { key: "retur", href: "/retur-penjualan", label: "Retur Penjualan", icon: RotateCcw }
  ] as const;

  return (
    <section className="flex h-full min-h-0 bg-[#eef3ef] p-0 text-[#262b28] lg:p-0">
      <div className="flex min-h-0 w-full flex-col overflow-hidden bg-[#fbfcfb] lg:rounded-[14px] lg:border lg:border-[#dce3de] lg:shadow-[0_18px_48px_rgba(50,75,63,0.1)]">
        <header className="flex flex-wrap items-center gap-3 border-b border-[#e7ebe8] bg-[rgba(251,252,251,0.94)] px-4 py-3 text-[#26312c] backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#eaf5ef] shadow-[0_2px_7px_rgba(36,68,62,0.14)]">
              <Image src="/apotek-ananda-logo-plus.svg" alt="Apotek Ananda" width={32} height={32} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#26312c]">Apotek Ananda</p>
              <p className="truncate text-[11px] font-semibold text-[#858d87]">
                {user?.name ?? "Kasir"} - Apotek Ananda
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 rounded-full bg-[#f3f7f5] p-1 text-xs font-bold text-[#6b746e] md:flex">
            {navItems.map(({ key, href, label, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className={`inline-flex h-8 items-center gap-2 rounded-full px-3 transition ${
                  active === key
                    ? "bg-[#dcf1e7] px-4 text-[#1c6e5b]"
                    : "hover:bg-[#eef3f0] hover:text-[#1f6f5d]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <div className="hidden h-9 items-center gap-2 rounded-full border border-[#e1e6e3] bg-white px-3 text-xs font-bold text-[#68716b] sm:flex">
              <Search className="h-3.5 w-3.5" strokeWidth={1.9} />
              Produk Supabase
            </div>
            <div className="hidden h-9 items-center gap-2 rounded-full border border-[#e1e6e3] bg-white px-3 text-xs font-bold text-[#68716b] sm:flex">
              <Clock className="h-3.5 w-3.5 text-[#267d6b]" strokeWidth={1.9} />
              {clock}
            </div>
            <button
              type="button"
              aria-label="Logout kasir"
              onClick={handleLogout}
              className="grid h-9 w-9 place-items-center rounded-full bg-[#eef3f0] text-[#68716b] transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.9} />
            </button>
          </div>
        </header>

        {children}
      </div>
    </section>
  );
}
