"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isKasir = user?.role === "kasir";
  const kasirPath = "/penjualan/kasir";
  const kasirAllowedPaths = [kasirPath, "/penjualan", "/retur-penjualan"];
  const isKasirAllowedPath = kasirAllowedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  useEffect(() => {
    if (isKasir && !isKasirAllowedPath) {
      router.replace(kasirPath);
    }
  }, [isKasir, isKasirAllowedPath, router]);

  if (isKasir) {
    if (!isKasirAllowedPath) {
      return null;
    }

    return (
      <div className="kasir-app-shell h-[100dvh] bg-[#eef3ef] p-0 text-stone-950 lg:p-4">
        <main className="h-[100dvh] overflow-hidden bg-[#fbfcfb] lg:h-[calc(100dvh-32px)] lg:rounded-[14px] lg:border lg:border-[#dce3de] lg:shadow-[0_18px_48px_rgba(50,75,63,0.1)]">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#eef3ef] p-0 text-stone-950 lg:p-5">
      <div className="dashboard-app-shell">
        <div className="dashboard-side-rail">
          <Link href="/dashboard" className="dashboard-brand-mark" title="Apotek Ananda">
            <Image src="/apotek-ananda-logo-plus.svg" alt="Apotek Ananda" width={38} height={38} />
          </Link>
          <Sidebar />
        </div>
        <div className="dashboard-content min-w-0 flex-1 bg-[#fbfcfb]">
          <Navbar />
          <main className="mx-auto w-full max-w-[1540px] px-4 pb-8 pt-4 lg:px-6 lg:pt-5 xl:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
