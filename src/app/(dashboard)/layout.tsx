import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-[100dvh] overflow-hidden bg-[#eef3ef] p-0 text-stone-950 lg:p-5">
      <div className="dashboard-app-shell">
        <div className="dashboard-side-rail">
          <Link href="/dashboard" className="dashboard-brand-mark" title="Apotek Ananda">
            <img src="/apotek-ananda-logo-plus.svg" alt="Apotek Ananda" />
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
