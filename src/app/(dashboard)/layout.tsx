import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#eef3ef] p-0 text-stone-950 lg:p-5">
      <div className="dashboard-app-shell">
        <Sidebar />
        <div className="min-w-0 flex-1 bg-[#fbfcfb]">
          <Navbar />
          <main className="mx-auto w-full max-w-[1540px] px-4 pb-8 pt-4 lg:px-6 lg:pt-5 xl:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
