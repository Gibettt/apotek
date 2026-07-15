"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Maximize2,
  MoreVertical,
  PackageOpen,
  Pill,
  Search,
  TrendingUp,
  X
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  buildDashboardView,
  type DashboardCategory,
  type DashboardPeriod
} from "@/lib/dashboard-view";
import { formatCurrency } from "@/utils/formatCurrency";
import { cn } from "@/utils/cn";

const periods: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "7", label: "7 hari terakhir" },
  { value: "30", label: "30 hari terakhir" },
  { value: "90", label: "90 hari terakhir" }
];

const categories: Array<{ value: DashboardCategory; label: string }> = [
  { value: "semua", label: "Semua kategori" },
  { value: "analgesik", label: "Analgesik" },
  { value: "antibiotik", label: "Antibiotik" },
  { value: "vitamin", label: "Vitamin" }
];

const prescriptions = [
  { date: "14", month: "Jul", time: "09.00", name: "Siti Rahma", detail: "Vitamin C 500mg", value: "10 tablet" },
  { date: "14", month: "Jul", time: "10.30", name: "Budi Santoso", detail: "Paracetamol 500mg", value: "12 tablet" },
  { date: "15", month: "Jul", time: "13.15", name: "Rani Kusuma", detail: "Amoxicillin 500mg", value: "20 kapsul" }
];

function compactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `Rp${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1
    })}jt`;
  }

  return formatCurrency(value);
}

function SectionHeader({
  title,
  icon: Icon,
  action
}: {
  title: string;
  icon: typeof Activity;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 pb-3">
      <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.03em] text-stone-600">
        <Icon className="h-4 w-4 text-stone-500" strokeWidth={1.6} />
        <h2>{title}</h2>
      </div>
      {action ?? <MoreVertical className="h-4 w-4 text-stone-400" strokeWidth={1.8} />}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-40 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-[0_14px_32px_rgba(36,41,37,.12)]">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="mt-1 flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-stone-500">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
          <strong className="font-semibold text-stone-900">{compactCurrency(item.value ?? 0)}</strong>
        </div>
      ))}
    </div>
  );
}

function SalesChart({
  data,
  dataKey,
  label,
  gradientId
}: {
  data: ReturnType<typeof buildDashboardView>["chart"];
  dataKey: "revenue" | "profit";
  label: string;
  gradientId: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 18, right: 3, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#2b8b7a" stopOpacity={0.2} />
            <stop offset="96%" stopColor="#2b8b7a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e9ece9" strokeDasharray="2 4" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#929892", fontSize: 11 }} dy={10} />
        <YAxis hide domain={[0, "dataMax + 15000"]} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#b8c8c0", strokeDasharray: "3 3" }} />
        <Area type="monotone" dataKey={dataKey} name={label} stroke="#247967" strokeWidth={2} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("7");
  const [category, setCategory] = useState<DashboardCategory>("semua");
  const [metric, setMetric] = useState<"revenue" | "profit">("revenue");
  const [stockOnly, setStockOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [isSalesChartOpen, setIsSalesChartOpen] = useState(false);
  const salesChartTriggerRef = useRef<HTMLDivElement>(null);
  const salesChartDialogRef = useRef<HTMLDivElement>(null);

  const view = useMemo(
    () => buildDashboardView({ period, category }),
    [category, period]
  );
  const periodLabel = periods.find((item) => item.value === period)?.label ?? "7 hari terakhir";
  const revenueValue = metric === "revenue" ? view.revenue : view.profit;
  const chartKey = metric === "revenue" ? "revenue" : "profit";
  const chartLabel = metric === "revenue" ? "Pendapatan" : "Laba kotor";
  useEffect(() => {
    if (isSalesChartOpen) salesChartDialogRef.current?.focus();
  }, [isSalesChartOpen]);

  const closeSalesChart = () => {
    setIsSalesChartOpen(false);
    salesChartTriggerRef.current?.focus();
  };
  const tableRows = view.activeMedicines.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase());
    const matchesStock = !stockOnly || item.stock < item.minimumStock;
    return matchesSearch && matchesStock;
  });
  const totalCategoryStock = Math.max(view.totalStock, 1);

  return (
    <div className="dashboard-page pb-6">
      <div className="dashboard-filter-row">
        <label className="dashboard-filter">
          <CalendarDays className="h-4 w-4" strokeWidth={1.7} />
          <select aria-label="Pilih periode" value={period} onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}>
            {periods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.7} />
        </label>
        <label className="dashboard-filter">
          <Pill className="h-4 w-4" strokeWidth={1.7} />
          <select aria-label="Pilih kategori" value={category} onChange={(event) => setCategory(event.target.value as DashboardCategory)}>
            {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.7} />
        </label>
        <button type="button" onClick={() => setStockOnly((current) => !current)} className={cn("dashboard-filter dashboard-filter-button", stockOnly && "dashboard-filter-active")}>
          <PackageOpen className="h-4 w-4" strokeWidth={1.7} />
          Perlu restock
        </button>
      </div>

      <section className="dashboard-top-grid">
        <article className="dashboard-surface">
          <SectionHeader
            title="Ringkasan penjualan"
            icon={CircleDollarSign}
            action={
              <button
                type="button"
                aria-label="Buka grafik layar penuh"
                title="Perbesar grafik"
                className="dashboard-top-action"
                onClick={() => setIsSalesChartOpen(true)}
              >
                <Maximize2 className="h-4 w-4" strokeWidth={1.8} />
              </button>
            }
          />
          <div className="dashboard-metric-line">
            <div>
              <p className="dashboard-number">{compactCurrency(revenueValue)}</p>
              <p className="dashboard-helper">{periodLabel}</p>
            </div>
            <div className="dashboard-toggle" aria-label="Pilih nilai grafik">
              <button type="button" className={cn(metric === "revenue" && "is-selected")} onClick={() => setMetric("revenue")}>Pendapatan</button>
              <button type="button" className={cn(metric === "profit" && "is-selected")} onClick={() => setMetric("profit")}>Laba</button>
            </div>
          </div>
          <div
            ref={salesChartTriggerRef}
            role="button"
            tabIndex={0}
            aria-label="Perbesar grafik penjualan"
            className="mt-3 h-[218px] w-full cursor-zoom-in rounded-lg outline-none transition hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-[#2b8b7a] focus-visible:ring-offset-2 sm:h-[252px]"
            onClick={() => setIsSalesChartOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsSalesChartOpen(true);
              }
            }}
          >
            <SalesChart data={view.chart} dataKey={chartKey} label={chartLabel} gradientId="dashboard-chart-fill" />
          </div>
        </article>

        <article className="dashboard-surface">
          <SectionHeader title="Ketersediaan stok" icon={TrendingUp} />
          <div className="dashboard-metric-line">
            <div>
              <p className="dashboard-number">{view.activeMedicines.length}</p>
              <p className="dashboard-helper">Obat aktif pada filter ini</p>
            </div>
            <div className="dashboard-segment" aria-label="Status stok">
              <span>Normal</span>
              <strong>{view.lowStockCount} perlu dicek</strong>
            </div>
          </div>
          <div className="mt-7 grid h-[218px] grid-cols-4 items-end gap-4 px-1 sm:h-[252px] sm:grid-cols-7">
            {view.chart.map((point, index) => {
              const baseline = Math.max(...view.chart.map((entry) => entry.transactions));
              const foreground = Math.max(22, Math.round((point.transactions / baseline) * 78));
              const background = Math.min(98, foreground + 20 + (index % 3) * 4);
              return (
                <div key={point.label} className="flex h-full flex-col items-center justify-end gap-3">
                  <div className="relative h-full w-3.5 rounded-full bg-[#e9f4ee] sm:w-4">
                    <span className="absolute inset-x-0 bottom-0 rounded-full bg-[#bfe5d6]" style={{ height: `${background}%` }} />
                    <span className="absolute inset-x-[2px] bottom-[2px] rounded-full bg-[#259176]" style={{ height: `${foreground}%` }} />
                  </div>
                  <span className="text-[11px] font-medium text-stone-400">{point.label}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="dashboard-activity-section">
        <SectionHeader title="Aktivitas apotek" icon={Activity} />
        <div className="dashboard-activity-grid">
          <article className="dashboard-inset-card">
            <h3>Jadwal resep</h3>
            <div className="mt-3 space-y-2">
              {prescriptions.map((item) => (
                <div key={`${item.date}-${item.name}`} className="dashboard-appointment">
                  <div className="dashboard-date"><strong>{item.date}</strong><span>{item.month}</span></div>
                  <div className="min-w-0 flex-1"><p>{item.time} - {item.name}</p><span>{item.detail}</span></div>
                  <strong className="shrink-0 text-xs text-stone-700">{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-inset-card">
            <h3>Prioritas stok</h3>
            <div className="mt-5 flex items-start justify-between gap-3 border-b border-stone-100 pb-3 text-xs text-stone-500">
              <span>Stok tersedia</span><strong className="text-stone-900">Minimum</strong><span>Keadaan</span>
            </div>
            <div className="mt-5 flex h-[120px] items-end gap-2.5">
              {view.activeMedicines.slice(0, 4).map((item) => {
                const height = Math.max(28, Math.round((item.stock / totalCategoryStock) * 170));
                const low = item.stock < item.minimumStock;
                return <div key={item.id} className="flex min-w-0 flex-1 flex-col justify-end gap-2"><div className={cn("rounded-t-lg bg-[#cde8de]", low && "bg-[#f6c7b0")} style={{ height: `${height}px` }} /><span className="truncate text-center text-[10px] text-stone-500">{item.name.split(" ")[0]}</span></div>;
              })}
            </div>
          </article>

          <article className="dashboard-inset-card">
            <h3>Perlu perhatian</h3>
            <div className="mt-3 space-y-2">
              {view.activeMedicines.filter((item) => item.stock < item.minimumStock).length ? view.activeMedicines.filter((item) => item.stock < item.minimumStock).map((item) => <div key={item.id} className="dashboard-alert-row"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#fdf0e9] text-[#d76e3c]"><Pill className="h-4 w-4" strokeWidth={1.8} /></span><div className="min-w-0 flex-1"><p>{item.name}</p><span>Sisa {item.stock} dari minimum {item.minimumStock}</span></div><strong>Restock</strong></div>) : <div className="dashboard-empty">Stok pada kategori ini masih aman.</div>}
            </div>
          </article>
        </div>
      </section>

      <section className="dashboard-table-section">
        <SectionHeader title="Obat aktif hari ini" icon={ClipboardList} action={<span className="text-xs font-medium text-stone-400">{tableRows.length} item</span>} />
        <div className="dashboard-table-toolbar">
          <label className="dashboard-search"><Search className="h-4 w-4" strokeWidth={1.8} /><input aria-label="Cari obat aktif" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari obat" /></label>
          <span>{periodLabel}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="dashboard-table">
            <thead><tr><th><input aria-label="Pilih semua obat" type="checkbox" /></th><th>Obat</th><th>Kategori</th><th>Stok</th><th>Harga jual</th><th>Status</th><th><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody>
              {tableRows.map((item) => <tr key={item.id}><td><input aria-label={`Pilih ${item.name}`} type="checkbox" /></td><td><strong>{item.name}</strong></td><td>{item.category}</td><td>{item.stock} <span className="text-stone-400">/ min. {item.minimumStock}</span></td><td>{formatCurrency(item.price)}</td><td><span className={cn("dashboard-status", item.status === "Perlu restock" && "dashboard-status-warning")}>{item.status}</span></td><td><button type="button" aria-label={`Aksi untuk ${item.name}`} className="text-stone-400 hover:text-stone-800"><MoreVertical className="h-4 w-4" strokeWidth={1.8} /></button></td></tr>)}
            </tbody>
          </table>
          {!tableRows.length && <div className="dashboard-empty m-4">Tidak ada obat yang sesuai dengan filter.</div>}
        </div>
      </section>

      {isSalesChartOpen && (
        <div
          className="modal-fade fixed inset-0 z-50 grid place-items-center bg-stone-950/35 p-4 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSalesChart();
          }}
        >
          <div
            ref={salesChartDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Grafik ringkasan penjualan"
            tabIndex={-1}
            className="modal-pop w-full max-w-5xl rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_24px_80px_rgba(31,41,35,.25)] sm:p-6"
            onKeyDown={(event) => {
              if (event.key === "Escape") closeSalesChart();
            }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-stone-900">Ringkasan penjualan</p>
                <p className="mt-1 text-xs text-stone-500">{chartLabel} · {periodLabel}</p>
              </div>
              <button type="button" aria-label="Tutup grafik" className="dashboard-top-action" onClick={closeSalesChart}>
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
            <div className="h-[min(65vh,620px)] min-h-80 pt-4">
              <SalesChart data={view.chart} dataKey={chartKey} label={chartLabel} gradientId="dashboard-chart-fill-expanded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
