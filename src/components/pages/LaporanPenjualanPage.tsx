"use client";

import {
  Banknote,
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  Lock,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingBag,
  TrendingUp,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { laporanService, type SalesReportParams } from "@/services/laporanService";
import type { MetodePembayaran, SalesReportRow, SalesReportSummary, StatusPenjualan } from "@/types";
import { buildCsv } from "@/utils/exportExcel";
import { buildPrintableReport } from "@/utils/exportPdf";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

const defaultSummary: SalesReportSummary = {
  totalRevenue: 0,
  totalTransactions: 0,
  averageTransaction: 0,
  totalItems: 0,
  completedTransactions: 0,
  canceledTransactions: 0,
  cashRevenue: 0,
  transferRevenue: 0,
  accurateRevenue: 0
};

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end)
  };
}

function methodLabel(value: string) {
  if (value === "accurate") {
    return "Accurate e-Payment";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusVariant(status: string) {
  if (status === "selesai") {
    return "success";
  }
  if (status === "menunggu_pembayaran") {
    return "warning";
  }
  return "danger";
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "stone"
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "stone" | "green" | "orange" | "blue";
}) {
  const toneClass = {
    stone: "bg-[#f8f7f3] text-[#20201d]",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-[#fff0ea] text-[#ff6a3d]",
    blue: "bg-sky-50 text-sky-700"
  }[tone];

  return (
    <div className="rounded-lg bg-white p-4 shadow-[0_18px_52px_rgba(25,24,21,.07)]">
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-2xl font-black leading-none text-[#20201d]">
            {value}
          </p>
          <p className="mt-1 text-xs font-bold text-stone-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function PaymentBreakdown({
  label,
  value,
  max,
  icon: Icon
}: {
  label: string;
  value: number;
  max: number;
  icon: LucideIcon;
}) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;

  return (
    <div className="rounded-lg bg-[#f8f7f3] p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#ff6a3d] shadow-sm">
            <Icon className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#20201d]">{label}</p>
            <p className="mt-1 text-xs font-semibold text-stone-500">
              {formatCurrency(value)}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-[#ff6a3d] transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function LaporanPenjualanPage() {
  const { user } = useAuth();
  const canViewSalesReport = user?.role === "owner";
  const range = useMemo(defaultRange, []);
  const [startDate, setStartDate] = useState(range.startDate);
  const [endDate, setEndDate] = useState(range.endDate);
  const [metodePembayaran, setMetodePembayaran] =
    useState<MetodePembayaran | "semua">("semua");
  const [status, setStatus] = useState<StatusPenjualan | "semua">("semua");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<SalesReportRow[]>([]);
  const [summary, setSummary] = useState<SalesReportSummary>(defaultSummary);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadReport() {
      if (!canViewSalesReport) {
        setRows([]);
        setSummary(defaultSummary);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const params: SalesReportParams = {
          startDate,
          endDate,
          metodePembayaran,
          status,
          search
        };
        const result = await laporanService.salesReport(params);

        if (!active) {
          return;
        }

        setRows(result.rows);
        setSummary(result.summary);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat laporan penjualan"
          );
          setRows([]);
          setSummary(defaultSummary);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      active = false;
    };
  }, [canViewSalesReport, endDate, metodePembayaran, search, startDate, status]);

  const maxPayment = Math.max(
    summary.cashRevenue,
    summary.transferRevenue,
    summary.accurateRevenue
  );

  function resetFilter() {
    const nextRange = defaultRange();
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
    setMetodePembayaran("semua");
    setStatus("semua");
    setSearch("");
  }

  function exportCsv() {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `laporan-penjualan-${startDate}-${endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("CSV laporan penjualan dibuat");
  }

  function printReport() {
    const report = buildPrintableReport("Laporan Penjualan", rows);
    const win = window.open("", "_blank", "width=760,height=900");

    if (!win) {
      toast.error("Popup print diblokir browser");
      return;
    }

    win.document.write(`<pre>${report.summary}</pre>`);
    win.document.close();
    win.print();
  }

  return (
    <>
      <Header
        title="Laporan Penjualan"
        description="Pantau revenue, metode pembayaran, dan transaksi penjualan per periode."
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button type="button" variant="secondary" onClick={printReport}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        }
      />

      {!canViewSalesReport ? (
        <section className="dashboard-surface grid min-h-[360px] place-items-center">
          <div className="grid max-w-sm place-items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#e8f4ef] text-[#267d6b]">
              <Lock className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <h2 className="text-xl font-black text-[#20201d]">Khusus Owner</h2>
            <p className="text-sm font-semibold leading-6 text-stone-500">
              Laporan penjualan hanya bisa dilihat akun owner.
            </p>
          </div>
        </section>
      ) : (
        <>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total penjualan"
          value={formatCurrency(summary.totalRevenue)}
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Transaksi"
          value={summary.totalTransactions}
          icon={ReceiptText}
          tone="orange"
        />
        <StatCard
          label="Rata-rata transaksi"
          value={formatCurrency(summary.averageTransaction)}
          icon={BarChart3}
          tone="blue"
        />
        <StatCard
          label="Item terjual"
          value={summary.totalItems}
          icon={ShoppingBag}
        />
      </section>

      <section className="space-y-5">
        <div className="dashboard-surface">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#20201d]">
                Filter Laporan
              </h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                Periode, metode bayar, status, dan pencarian transaksi.
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
              <CalendarDays className="h-5 w-5" strokeWidth={1.9} />
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Dari"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <Input
              label="Sampai"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
            <Select
              label="Metode"
              value={metodePembayaran}
              onChange={(event) =>
                setMetodePembayaran(
                  event.target.value as MetodePembayaran | "semua"
                )
              }
              options={[
                { label: "Semua metode", value: "semua" },
                { label: "Tunai", value: "tunai" },
                { label: "Transfer", value: "transfer" },
                { label: "Accurate e-Payment", value: "accurate" }
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusPenjualan | "semua")
              }
              options={[
                { label: "Semua status", value: "semua" },
                { label: "Selesai", value: "selesai" },
                {
                  label: "Menunggu pembayaran",
                  value: "menunggu_pembayaran"
                },
                { label: "Gagal", value: "gagal" },
                { label: "Dibatalkan", value: "dibatalkan" }
              ]}
            />
            <div className="relative md:col-span-2 xl:col-span-3">
              <Search className="pointer-events-none absolute left-4 top-[38px] h-4 w-4 text-stone-400" />
              <Input
                label="Cari"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nomor transaksi, pelanggan, metode..."
                className="pl-10"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                onClick={resetFilter}
                className="h-10 w-full rounded-lg"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="dashboard-surface">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#20201d]">
                Komposisi Pembayaran
              </h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                Nilai transaksi selesai per metode tanpa mengambil ruang tabel.
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#f8f7f3] text-[#ff6a3d]">
              <WalletCards className="h-5 w-5" strokeWidth={1.9} />
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_220px]">
            <PaymentBreakdown
              label="Tunai"
              value={summary.cashRevenue}
              max={maxPayment}
              icon={Banknote}
            />
            <PaymentBreakdown
              label="Transfer"
              value={summary.transferRevenue}
              max={maxPayment}
              icon={CreditCard}
            />
            <PaymentBreakdown
              label="Accurate e-Payment"
              value={summary.accurateRevenue}
              max={maxPayment}
              icon={CreditCard}
            />
            <div className="rounded-lg bg-[#080c1c] p-4 text-white">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-white/65">
                  Selesai
                </span>
                <strong className="text-xl">
                  {summary.completedTransactions}
                </strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-white/65">
                  Dibatalkan
                </span>
                <strong className="text-xl">
                  {summary.canceledTransactions}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-table-section overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-[#20201d]">
                Transaksi Penjualan
              </h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                {isLoading ? "Memuat data..." : `${rows.length} transaksi ditemukan`}
              </p>
            </div>
            <Badge variant="info">
              {formatDate(startDate)} - {formatDate(endDate)}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4">Referensi</th>
                  <th className="px-5 py-4">Pelanggan</th>
                  <th className="px-5 py-4">Metode</th>
                  <th className="px-5 py-4">Item</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm font-semibold text-stone-500"
                    >
                      Memuat laporan penjualan...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-stone-100 transition hover:bg-[#f8f7f3]"
                    >
                      <td className="px-5 py-4 font-semibold text-stone-600">
                        {formatDate(row.tanggal)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-black text-[#20201d]">
                          {row.referensi}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-stone-400">
                          Bayar {formatCurrency(row.bayar)}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-600">
                        {row.pelanggan}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="muted">{methodLabel(row.kategori)}</Badge>
                      </td>
                      <td className="px-5 py-4 font-black text-[#20201d]">
                        {row.itemCount}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-black text-[#20201d]">
                          {formatCurrency(row.nilai)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-stone-400">
                          Kembali {formatCurrency(row.kembalian)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant(row.status)}>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm font-semibold text-stone-500"
                    >
                      Tidak ada transaksi pada filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
        </>
      )}
    </>
  );
}
