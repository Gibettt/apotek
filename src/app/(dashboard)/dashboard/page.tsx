"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  MoreVertical,
  Package,
  Pause,
  Pill,
  Play,
  ReceiptText,
  Search,
  Users
} from "lucide-react";
import {
  Bar,
  BarChart,
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
import { obatService } from "@/services/obatService";
import { pelangganService } from "@/services/pelangganService";
import { penjualanService } from "@/services/penjualanService";
import { resepService } from "@/services/resepService";
import type { Resep } from "@/types";
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

const weekDayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

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
  badge
}: {
  icon: typeof Users;
  iconClass: string;
  value: React.ReactNode;
  label: string;
  href: string;
  badge?: React.ReactNode;
}) {
  return (
    <article className="dashboard-surface dashboard-stat-card">
      <div className="dashboard-stat-top">
        <span className={cn("dashboard-stat-icon", iconClass)}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="dashboard-stat-value">{value}</p>
          <p className="dashboard-stat-label">{label}</p>
        </div>
        {badge}
      </div>
      <Link href={href} className="dashboard-stat-footer">
        Lihat detail <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
    </article>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("7");
  const [category, setCategory] = useState<DashboardCategory>("semua");
  const [stockOnly, setStockOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [scheduleTab, setScheduleTab] = useState<"resep" | "kunjungan">("resep");
  const [now, setNow] = useState(() => Date.now());
  const [heldTimer, setHeldTimer] = useState(false);

  const [totalPelanggan, setTotalPelanggan] = useState<number | null>(null);
  const [totalObat, setTotalObat] = useState<number | null>(null);
  const [transaksiHariIni, setTransaksiHariIni] = useState<number | null>(null);
  const [resepMenunggu, setResepMenunggu] = useState<Resep[]>([]);
  const [resepDiproses, setResepDiproses] = useState<Resep | null>(null);
  const [busyResepId, setBusyResepId] = useState<string | null>(null);

  const [view, setView] = useState<Awaited<ReturnType<typeof buildDashboardView>>>({
    chart: [],
    lowStockCount: 0,
    activeMedicines: []
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    buildDashboardView({ period, category }).then((result) => {
      if (active) {
        setView(result);
      }
    });

    return () => {
      active = false;
    };
  }, [category, period]);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      const todayIso = new Date().toISOString().slice(0, 10);
      const [pelangganRes, obatRes, resepRes, penjualanRes] = await Promise.all([
        pelangganService.list({ perPage: 1 }),
        obatService.list({ perPage: 1 }),
        resepService.list({ perPage: 200 }),
        penjualanService.list({ perPage: 200 })
      ]);

      if (!active) return;

      setTotalPelanggan(pelangganRes.total);
      setTotalObat(obatRes.total);
      setResepMenunggu(resepRes.data.filter((item) => item.status === "menunggu"));
      setResepDiproses(resepRes.data.find((item) => item.status === "diproses") ?? null);
      setTransaksiHariIni(
        penjualanRes.data.filter((item) => item.tanggal?.slice(0, 10) === todayIso).length
      );
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

  const periodLabel = periods.find((item) => item.value === period)?.label ?? "7 hari terakhir";
  const tableRows = view.activeMedicines.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase());
    const matchesStock = !stockOnly || item.stock < item.minimumStock;
    return matchesSearch && matchesStock;
  });

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
          <Package className="h-4 w-4" strokeWidth={1.7} />
          Perlu restock
        </button>
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
          label="Total Obat"
          href="/obat"
          badge={
            view.lowStockCount > 0 ? (
              <span className="dashboard-stat-trend dashboard-stat-trend-down">{view.lowStockCount} restock</span>
            ) : null
          }
        />
        <StatCard
          icon={ReceiptText}
          iconClass="dashboard-stat-icon-coral"
          value={transaksiHariIni ?? "…"}
          label="Transaksi Hari Ini"
          href="/penjualan"
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

        <article className="dashboard-surface">
          <SectionHeader title="Grafik penjualan" icon={ReceiptText} action={<span className="text-xs font-medium text-stone-400">{periodLabel}</span>} />
          <div className="dashboard-weekly-legend">
            <span><i style={{ background: "#2f9b7f" }} />Pendapatan</span>
            <span><i style={{ background: "#bfe5d6" }} />Laba</span>
          </div>
          <div className="h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.chart} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barGap={3}>
                <CartesianGrid vertical={false} stroke="#e9ece9" strokeDasharray="2 4" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#929892", fontSize: 11 }} dy={8} />
                <YAxis hide domain={[0, "dataMax + 15000"]} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(36,121,103,0.06)" }} />
                <Bar dataKey="revenue" name="Pendapatan" fill="#2f9b7f" radius={[4, 4, 0, 0]} maxBarSize={11} />
                <Bar dataKey="profit" name="Laba" fill="#bfe5d6" radius={[4, 4, 0, 0]} maxBarSize={11} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="dashboard-bottom-row">
        <article className="dashboard-table-section">
          <SectionHeader title="Obat aktif hari ini" icon={ClipboardList} action={<span className="text-xs font-medium text-stone-400">{tableRows.length} item</span>} />
          <div className="dashboard-table-toolbar">
            <label className="dashboard-search"><Search className="h-4 w-4" strokeWidth={1.8} /><input aria-label="Cari obat aktif" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari obat" /></label>
            <span>{periodLabel}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th><input aria-label="Pilih semua obat" type="checkbox" /></th>
                  <th>Obat</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Harga jual</th>
                  <th>Status</th>
                  <th><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((item) => {
                  const low = item.stock < item.minimumStock;
                  const ratio = Math.min(100, Math.round((item.stock / Math.max(item.minimumStock * 2, 1)) * 100));
                  return (
                    <tr key={item.id}>
                      <td><input aria-label={`Pilih ${item.name}`} type="checkbox" /></td>
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
            {!tableRows.length && <div className="dashboard-empty m-4">Tidak ada obat yang sesuai dengan filter.</div>}
          </div>
        </article>

        <article className="dashboard-surface">
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
