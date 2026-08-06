"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Clock, LogOut, Menu, ReceiptText, RotateCcw, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/formatCurrency";

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
  const subtotal = useCartStore((state) => state.subtotal);
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
    <section className="flex h-full min-h-0 bg-[#9fb66c] p-3 text-[#171717] lg:p-5">
      <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-[26px] border-[10px] border-[#151514] bg-[#151514] shadow-[0_30px_80px_rgba(13,18,12,0.28)]">
        <header className="flex flex-wrap items-center gap-3 rounded-t-[16px] bg-[#151514] px-3 py-2 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#d5eb72]">
              <Image src="/apotek-ananda-logo-plus.svg" alt="Apotek Ananda" width={32} height={32} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">Apotek Ananda</p>
              <p className="truncate text-[11px] font-semibold text-white/55">
                {user?.name ?? "Kasir"} - Apotek Ananda
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 rounded-full bg-white/8 p-1 text-xs font-bold text-white/60 md:flex">
            {navItems.map(({ key, href, label, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className={`inline-flex h-8 items-center gap-2 rounded-full px-3 transition ${
                  active === key
                    ? "bg-[#cdb7ff] px-4 text-[#171717]"
                    : "hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <div className="hidden h-9 items-center gap-2 rounded-full bg-white/8 px-3 text-xs font-bold text-white/70 sm:flex">
              <Search className="h-3.5 w-3.5" strokeWidth={1.9} />
              Produk Supabase
            </div>
            <div className="hidden h-9 items-center gap-2 rounded-full bg-white/8 px-3 text-xs font-bold text-white/70 sm:flex">
              <Clock className="h-3.5 w-3.5 text-[#d5eb72]" strokeWidth={1.9} />
              {clock}
            </div>
            <div className="h-9 rounded-full bg-[#d5eb72] px-3 py-1 text-right text-[#171717]">
              <p className="text-[10px] font-bold text-black/50">Total order</p>
              <p className="text-sm font-black leading-4">{formatCurrency(subtotal())}</p>
            </div>
            <button
              type="button"
              aria-label="Logout kasir"
              onClick={handleLogout}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-red-500"
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
