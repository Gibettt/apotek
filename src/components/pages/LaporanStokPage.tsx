"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ReportPage } from "@/components/pages/ReportPage";
import { useAuth } from "@/hooks/useAuth";
import { laporanService } from "@/services/laporanService";
import type { ReportRow } from "@/types";

export function LaporanStokPage() {
  const { user } = useAuth();
  const canViewStockReport = user?.role === "owner";
  const [rows, setRows] = useState<ReportRow[]>([]);

  useEffect(() => {
    if (!canViewStockReport) {
      setRows([]);
      return;
    }

    let active = true;
    laporanService.stokReport().then((result) => {
      if (active) setRows(result);
    });

    return () => {
      active = false;
    };
  }, [canViewStockReport]);

  if (!canViewStockReport) {
    return (
      <>
        <Header
          title="Laporan Stok"
          description="Rekap barang masuk dari pembelian supplier. Penjualan tidak mengurangi angka ini."
        />
        <section className="dashboard-surface grid min-h-[360px] place-items-center">
          <div className="grid max-w-sm place-items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#e8f4ef] text-[#267d6b]">
              <Lock className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <h2 className="text-xl font-black text-[#20201d]">Khusus Owner</h2>
            <p className="text-sm font-semibold leading-6 text-stone-500">
              Laporan stok hanya bisa dilihat akun owner.
            </p>
          </div>
        </section>
      </>
    );
  }

  return (
    <ReportPage
      title="Stok Masuk Supplier"
      description="Rekap barang masuk dari pembelian supplier. Penjualan tidak mengurangi angka ini."
      rows={rows}
      summaryLabel="Total stok masuk"
      formatSummary={(value) => `${value.toLocaleString("id-ID")} item`}
      categoryHeader="Barang"
      valueHeader="Stok Masuk"
      formatValue={(value) => value.toLocaleString("id-ID")}
      statusHeader="Supplier"
    />
  );
}
