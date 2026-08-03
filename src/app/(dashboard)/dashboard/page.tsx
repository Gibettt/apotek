"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Lock,
  MoreVertical,
  Package,
  PackagePlus,
  Pause,
  Pill,
  Play,
  ReceiptText,
  Search,
  ShoppingBasket,
  TrendingUp,
  Users
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
import { isLowStock } from "@/lib/stockRules";
import { useAuth } from "@/hooks/useAuth";
import { obatService } from "@/services/obatService";
import { pelangganService } from "@/services/pelangganService";
import { penjualanService } from "@/services/penjualanService";
import { resepService } from "@/services/resepService";
import type { Resep } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

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

const weekDayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const medicineRowsPerPage = 10;

function compactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `Rp${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1
    })}jt`;
  }

  return formatCurrency(value);
}

function initials(name?: string) {
  return (name || "-")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function chartRangeForPeriod(period: DashboardPeriod) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - (Number(period) - 1));
  return { start: dateInputValue(start), end: dateInputValue(end) };
}

function monthYearLabel(date = new Date()) {
  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric"
  });
}

function elapsedSince(iso: string, now: number) {
  const ms = Math.max(0, now - new Date(iso).getTime());
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function SectionHeader({
  title,
  icon: Icon,
  action
}: {
  title: string;
  icon: typeof Clock;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pb-3">
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

function StatCard({
  icon: Icon,
  iconClass,
  value,
  label,
  href,
  badge,
  locked = false
}: {
  icon: typeof Users;
  iconClass: string;
  value: React.ReactNode;
  label: string;
  href: string;
  badge?: React.ReactNode;
  locked?: boolean;
}) {
  return (
    <article className="dashboard-surface dashboard-stat-card relative overflow-hidden">
      <div className={cn("dashboard-stat-top transition", locked && "pointer-events-none select-none blur-[10px] opacity-25")}>
        <span className={cn("dashboard-stat-icon", iconClass)}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="dashboard-stat-value">{value}</p>
          <p className="dashboard-stat-label">{label}</p>
        </div>
        {badge}
      </div>
      {locked ? (
        <button type="button" aria-label={`${label} terkunci`} disabled className="dashboard-stat-footer w-full cursor-not-allowed opacity-60">
          Khusus Owner <Lock className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ) : (
        <Link href={href} className="dashboard-stat-footer">
          Lihat detail <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      )}
      {locked ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-white/85 backdrop-blur-md">
          <div className="grid place-items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8f4ef] text-[#267d6b] shadow-sm">
              <Lock className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="text-xs font-black text-stone-600">Khusus Owner</span>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function DashboardFilterSelect<T extends string>({
  id,
  icon: Icon,
  label,
  value,
  options,
  open,
  onOpenChange,
  onChange
}: {
  id: string;
  icon: typeof CalendarDays;
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: T) => void;
}) {
  const selected = options.find((item) => item.value === value) ?? options[0];

  return (
    <div
      className="dashboard-filter-select"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onOpenChange(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        className={cn("dashboard-filter dashboard-filter-trigger", open && "dashboard-filter-open")}
        onClick={() => onOpenChange(!open)}
      >
        <span className="dashboard-filter-icon"><Icon className="h-4 w-4" strokeWidth={1.7} /></span>
        <span className="dashboard-filter-value">{selected.label}</span>
        <ChevronDown className="dashboard-filter-chevron h-3.5 w-3.5" strokeWidth={1.9} />
      </button>

      {open ? (
        <div id={`${id}-menu`} role="listbox" aria-label={label} className="dashboard-filter-menu">
          {options.map((item) => (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={item.value === value}
              className={cn("dashboard-filter-option", item.value === value && "dashboard-filter-option-active")}
              onClick={() => {
                onChange(item.value);
                onOpenChange(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const canViewOwnerOnly = user?.email.trim().toLowerCase() === "owner@gmail.com";
  const canViewSalesChart = canViewOwnerOnly;
  const [category, setCategory] = useState<DashboardCategory>("semua");
  const [chartRange, setChartRange] = useState(() => chartRangeForPeriod("7"));
  const [openFilter, setOpenFilter] = useState<"category" | null>(null);
  const [query, setQuery] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [scheduleTab, setScheduleTab] = useState<"resep" | "kunjungan">("resep");
  const [now, setNow] = useState(() => Date.now());
  const [heldTimer, setHeldTimer] = useState(false);

  const [totalPelanggan, setTotalPelanggan] = useState<number | null>(null);
  const [totalObat, setTotalObat] = useState<number | null>(null);
  const [totalTransaksi, setTotalTransaksi] = useState<number | null>(null);
  const [resepMenunggu, setResepMenunggu] = useState<Resep[]>([]);
  const [resepDiproses, setResepDiproses] = useState<Resep | null>(null);
  const [busyResepId, setBusyResepId] = useState<string | null>(null);

  const [view, setView] = useState<Awaited<ReturnType<typeof buildDashboardView>>>({
    chart: [],
    topSellingItems: [],
    lowStockCount: 0,
    activeMedicines: []
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    buildDashboardView({
      period: "7",
      category,
      startDate: chartRange.start,
      endDate: chartRange.end,
      includeSales: canViewSalesChart
    }).then((result) => {
      if (active) {
        setView(result);
      }
    });

    return () => {
      active = false;
    };
  }, [canViewSalesChart, category, chartRange.end, chartRange.start]);

  useEffect(() => {
    setTablePage(1);
  }, [query, view.activeMedicines]);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      const [pelangganRes, obatRes, resepRes, penjualanRes] = await Promise.all([
        pelangganService.list({ perPage: 1 }),
        obatService.list({ perPage: 1 }),
        resepService.list({ perPage: 200 }),
        penjualanService.list({ perPage: 1 })
      ]);

      if (!active) return;

      setTotalPelanggan(pelangganRes.total);
      setTotalObat(obatRes.total);
      setResepMenunggu(resepRes.data.filter((item) => item.status === "menunggu"));
      setResepDiproses(resepRes.data.find((item) => item.status === "diproses") ?? null);
      setTotalTransaksi(penjualanRes.total);
    }

    void loadStats();
    return () => {
      active = false;
    };
  }, []);

  const weekDays = useMemo(() => {
    const today = new Date();
    const dayIndex = today.getDay();
    const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    return weekDayLabels.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return { label, date: date.getDate(), isToday: date.toDateString() === today.toDateString() };
    });
  }, []);

  const periodLabel = "7 hari terakhir";
  const chartDateLabel =
    chartRange.start && chartRange.end
      ? chartRange.start === chartRange.end
        ? formatDate(`${chartRange.start}T00:00:00`)
        : `${formatDate(`${chartRange.start}T00:00:00`)} - ${formatDate(`${chartRange.end}T00:00:00`)}`
      : periodLabel;
  const tableRows = view.activeMedicines.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase());
    return matchesSearch;
  });
  const totalTablePages = Math.max(1, Math.ceil(tableRows.length / medicineRowsPerPage));
  const currentTablePage = Math.min(tablePage, totalTablePages);
  const pagedTableRows = tableRows.slice(
    (currentTablePage - 1) * medicineRowsPerPage,
    currentTablePage * medicineRowsPerPage
  );
  const topSellingMonthLabel = monthYearLabel();
  const maxTopSellingQuantity = Math.max(
    1,
    ...view.topSellingItems.map((item) => item.quantity)
  );

  async function handleSelesaiResep(id: string) {
    setBusyResepId(id);
    try {
      await resepService.updateStatus(id, "selesai");
      setResepDiproses(null);
      setHeldTimer(false);
    } catch (error) {
      console.error(error);
    } finally {
      setBusyResepId(null);
    }
  }

  return (
    <div className="dashboard-page pb-6">
      <div className="dashboard-filter-row">
        <DashboardFilterSelect
          id="dashboard-category-filter"
          icon={Pill}
          label="Pilih kategori"
          value={category}
          options={categories}
          open={openFilter === "category"}
          onOpenChange={(open) => setOpenFilter(open ? "category" : null)}
          onChange={setCategory}
        />
      </div>

      <section className="dashboard-stat-row">
        <StatCard
          icon={Users}
          iconClass="dashboard-stat-icon-mint"
          value={totalPelanggan ?? "…"}
          label="Total Pelanggan"
          href="/pelanggan"
        />
        <StatCard
          icon={ClipboardList}
          iconClass="dashboard-stat-icon-amber"
          value={resepMenunggu.length}
          label="Resep Menunggu"
          href="/resep"
        />
        <StatCard
          icon={Package}
          iconClass="dashboard-stat-icon-sky"
          value={totalObat ?? "…"}
          label="Total Barang"
          href="/obat"
          locked={!canViewOwnerOnly}
          badge={
            canViewOwnerOnly && view.lowStockCount > 0 ? (
              <span className="dashboard-stat-trend dashboard-stat-trend-down">{view.lowStockCount} restock</span>
            ) : null
          }
        />
        <StatCard
          icon={ReceiptText}
          iconClass="dashboard-stat-icon-coral"
          value={totalTransaksi ?? "…"}
          label="Total Transaksi"
          href="/penjualan"
          locked={!canViewOwnerOnly}
        />
      </section>

      <section className="dashboard-bento-row">
        <article className="dashboard-surface">
          <SectionHeader title="Resep diproses" icon={Clock} />
          {resepDiproses ? (
            <div className="dashboard-timer-frame">
              <p className="dashboard-timer-label">
                <Pill className="h-3.5 w-3.5" strokeWidth={1.8} />
                {resepDiproses.namaPasien || resepDiproses.namaPelanggan}
              </p>
              <p className="dashboard-timer-meta">Diproses · {resepDiproses.nomorResep ?? "-"}</p>
              <p className="dashboard-timer-clock">{elapsedSince(resepDiproses.createdAt, now)}</p>
              <div className="dashboard-timer-actions">
                <button type="button" className="dashboard-timer-pause" onClick={() => setHeldTimer((current) => !current)}>
                  {heldTimer ? <Play className="h-3.5 w-3.5" strokeWidth={2} /> : <Pause className="h-3.5 w-3.5" strokeWidth={2} />}
                  {heldTimer ? "Lanjutkan" : "Tahan"}
                </button>
                <button
                  type="button"
                  className="dashboard-timer-stop"
                  disabled={busyResepId === resepDiproses.id}
                  onClick={() => handleSelesaiResep(resepDiproses.id)}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2} /> Selesai
                </button>
              </div>
            </div>
          ) : (
            <div className="dashboard-empty">Tidak ada resep yang sedang diproses.</div>
          )}
          <div className="dashboard-timer-history">
            <h3>Resep sebelumnya</h3>
            {prescriptions.map((item) => (
              <div key={`${item.date}-${item.name}`} className="dashboard-timer-row">
                <span><Pill className="h-3.5 w-3.5" strokeWidth={1.8} /></span>
                <div className="min-w-0">
                  <strong className="block truncate">{item.name}</strong>
                  <span className="block truncate text-[11px] text-stone-400">{item.detail}</span>
                </div>
                <time>{item.time}</time>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-surface">
          <SectionHeader title="Antrian persetujuan resep" icon={ClipboardList} />
          <div className="dashboard-queue-tabs">
            <span>Menunggu</span>
            <span>{resepMenunggu.length} resep</span>
          </div>
          <div>
            {resepMenunggu.length ? (
              resepMenunggu.slice(0, 4).map((item) => (
                <div key={item.id} className="dashboard-queue-row">
                  <span className="dashboard-queue-avatar">{initials(item.namaPasien || item.namaPelanggan)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{item.namaPasien || item.namaPelanggan}</p>
                    <span className="dashboard-queue-sub truncate">{item.namaDokter || "Tanpa dokter"}</span>
                  </div>
                  <span className="dashboard-status">Menunggu</span>
                </div>
              ))
            ) : (
              <div className="dashboard-empty">Tidak ada resep menunggu persetujuan.</div>
            )}
          </div>
          <Link href="/resep" className="dashboard-queue-cta">
            Buka antrian resep <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </article>

        <article className="dashboard-surface relative overflow-hidden">
          <SectionHeader title="Grafik penjualan" icon={ReceiptText} action={<span className="text-xs font-medium text-stone-400">{chartDateLabel}</span>} />
          <div className={cn("transition", !canViewSalesChart && "pointer-events-none select-none blur-[10px] opacity-25")}>
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-[11px] font-semibold uppercase text-stone-400">
              Dari
              <input
                aria-label="Dari tanggal grafik"
                type="date"
                disabled={!canViewSalesChart}
                value={chartRange.start}
                max={chartRange.end}
                onChange={(event) =>
                  setChartRange((current) => ({ ...current, start: event.target.value }))
                }
                className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold normal-case text-stone-700 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase text-stone-400">
              Sampai
              <input
                aria-label="Sampai tanggal grafik"
                type="date"
                disabled={!canViewSalesChart}
                value={chartRange.end}
                min={chartRange.start}
                onChange={(event) =>
                  setChartRange((current) => ({ ...current, end: event.target.value }))
                }
                className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold normal-case text-stone-700 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
              />
            </label>
          </div>
          <div className="dashboard-weekly-legend">
            <span><i style={{ background: "#2f9b7f" }} />Pendapatan</span>
            <span><i style={{ background: "#bfe5d6" }} />Laba</span>
          </div>
          <div className="h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={view.chart} margin={{ top: 8, right: 6, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f9b7f" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2f9b7f" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="dashboardProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#bfe5d6" stopOpacity={0.62} />
                    <stop offset="95%" stopColor="#bfe5d6" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e9ece9" strokeDasharray="2 4" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#929892", fontSize: 11 }} dy={8} />
                <YAxis hide domain={[0, "dataMax + 15000"]} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(36,121,103,0.16)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="revenue" name="Pendapatan" stroke="#2f9b7f" strokeWidth={3} fill="url(#dashboardRevenue)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: "#2f9b7f" }} />
                <Area type="monotone" dataKey="profit" name="Laba" stroke="#9ad8c2" strokeWidth={3} fill="url(#dashboardProfit)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: "#9ad8c2" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          </div>
          {!canViewSalesChart && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-white/85 backdrop-blur-md">
              <div className="mx-6 grid max-w-64 place-items-center gap-2 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8f4ef] text-[#267d6b] shadow-sm">
                  <Lock className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <p className="text-sm font-semibold text-stone-900">Khusus Owner</p>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-top-products-section">
        <article className="dashboard-surface relative overflow-hidden">
          <SectionHeader
            title="Analisis penjualan produk"
            icon={TrendingUp}
            action={
              <span className="text-xs font-medium text-stone-400">
                {topSellingMonthLabel}
              </span>
            }
          />
          <div
            className={cn(
              "transition",
              !canViewOwnerOnly && "pointer-events-none select-none blur-[10px] opacity-25"
            )}
          >
            {view.topSellingItems.length ? (
              <div className="grid gap-3 lg:grid-cols-5">
                {view.topSellingItems.map((item, index) => {
                  const ratio = Math.max(
                    8,
                    Math.round((item.quantity / maxTopSellingQuantity) * 100)
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-stone-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e8f4ef] text-[#267d6b]">
                          <ShoppingBasket className="h-5 w-5" strokeWidth={1.8} />
                        </span>
                        <span className="rounded-full bg-[#20201d] px-2.5 py-1 text-xs font-black text-white">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="mt-3 truncate text-sm font-black text-[#20201d]">
                        {item.name}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-stone-500">
                        {item.category}
                      </p>
                      <div className="mt-4 h-2 rounded-full bg-[#edf0ee]">
                        <span
                          className="block h-full rounded-full bg-[#267d6b]"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="font-semibold text-stone-400">
                            Terjual
                          </p>
                          <p className="mt-1 font-black text-[#20201d]">
                            {item.quantity} item
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-stone-400">
                            Omzet
                          </p>
                          <p className="mt-1 font-black text-[#20201d]">
                            {compactCurrency(item.revenue)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#f8f7f3] px-3 py-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                          <PackagePlus className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Saran beli
                        </span>
                        <strong className="text-sm text-[#267d6b]">
                          {item.suggestedPurchase}
                        </strong>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-stone-400">
                        {item.transactionCount} transaksi bulan ini
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-empty">
                Belum ada penjualan selesai pada bulan ini.
              </div>
            )}
          </div>
          {!canViewOwnerOnly && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-white/85 backdrop-blur-md">
              <div className="mx-6 grid max-w-64 place-items-center gap-2 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8f4ef] text-[#267d6b] shadow-sm">
                  <Lock className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <p className="text-sm font-semibold text-stone-900">
                  Khusus Owner
                </p>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-bottom-row">
        <article className="dashboard-table-section">
          <SectionHeader title="Barang aktif" icon={ClipboardList} action={<span className="text-xs font-medium text-stone-400">{tableRows.length} item</span>} />
          <div className="dashboard-table-toolbar">
            <label className="dashboard-search"><Search className="h-4 w-4" strokeWidth={1.8} /><input aria-label="Cari barang aktif" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari barang" /></label>
            <span>{periodLabel}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Harga jual</th>
                  <th>Status</th>
                  <th><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {pagedTableRows.map((item) => {
                  const low = isLowStock(item.stock);
                  const ratio = Math.min(100, Math.round((item.stock / Math.max(item.minimumStock * 2, 1)) * 100));
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="dashboard-row-avatar"><Pill className="h-4 w-4" strokeWidth={1.8} /></span>
                          <strong>{item.name}</strong>
                        </div>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="dashboard-progress-track w-16">
                            <span className={cn("dashboard-progress-fill", low && "dashboard-progress-fill-low")} style={{ width: `${ratio}%` }} />
                          </div>
                          <span className="text-stone-400">{item.stock}/{item.minimumStock}</span>
                        </div>
                      </td>
                      <td>{formatCurrency(item.price)}</td>
                      <td><span className={cn("dashboard-status", item.status === "Perlu restock" && "dashboard-status-warning")}>{item.status}</span></td>
                      <td><button type="button" aria-label={`Aksi untuk ${item.name}`} className="text-stone-400 hover:text-stone-800"><MoreVertical className="h-4 w-4" strokeWidth={1.8} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!tableRows.length && <div className="dashboard-empty m-4">Tidak ada barang yang sesuai dengan filter.</div>}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-stone-100 px-4 py-3">
            <span className="mr-2 text-xs font-semibold text-stone-400">
              Halaman {currentTablePage} dari {totalTablePages}
            </span>
            <button
              type="button"
              aria-label="Halaman barang sebelumnya"
              disabled={currentTablePage <= 1}
              onClick={() => setTablePage((current) => Math.max(1, current - 1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:border-[#0f766e] hover:text-[#0f766e] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Halaman barang berikutnya"
              disabled={currentTablePage >= totalTablePages}
              onClick={() => setTablePage((current) => Math.min(totalTablePages, current + 1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:border-[#0f766e] hover:text-[#0f766e] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </article>

        <article className="hidden">
          <SectionHeader title="Jadwal resep & kunjungan" icon={CalendarDays} />
          <div className="dashboard-schedule-strip">
            {weekDays.map((day) => (
              <div key={day.label} className={cn("dashboard-schedule-day", day.isToday && "dashboard-schedule-day-active")}>
                <span>{day.label}</span>
                <strong>{day.date}</strong>
              </div>
            ))}
          </div>
          <div className="dashboard-schedule-tabs">
            <button type="button" className={cn("dashboard-schedule-tab", scheduleTab === "resep" && "dashboard-schedule-tab-active")} onClick={() => setScheduleTab("resep")}>
              Resep
            </button>
            <button type="button" className={cn("dashboard-schedule-tab", scheduleTab === "kunjungan" && "dashboard-schedule-tab-active")} onClick={() => setScheduleTab("kunjungan")}>
              Kunjungan Dokter
            </button>
          </div>
          {scheduleTab === "resep" ? (
            prescriptions.map((item) => (
              <div key={`${item.date}-${item.name}`} className="dashboard-schedule-card">
                <time>{item.time}</time>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{item.name}</p>
                  <span className="truncate">{item.detail} · {item.value}</span>
                </div>
                <div className="dashboard-schedule-avatars">
                  <span>{initials(item.name)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="dashboard-empty">Belum ada jadwal kunjungan dokter.</div>
          )}
        </article>
      </section>
    </div>
  );
}
