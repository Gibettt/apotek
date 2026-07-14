import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Ellipsis,
  PackageCheck,
  Pill,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import {
  dashboardSummary,
  kategoriObat,
  obat,
  penjualan,
  resep,
  stokBatches
} from "@/lib/mock-data";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatCurrency";

const monthlyBars = [
  { label: "Jan", revenue: 48, transactions: 30 },
  { label: "Feb", revenue: 58, transactions: 25 },
  { label: "Mar", revenue: 38, transactions: 22 },
  { label: "Apr", revenue: 52, transactions: 29 },
  { label: "Mei", revenue: 64, transactions: 26 },
  { label: "Jun", revenue: 88, transactions: 36 },
  { label: "Jul", revenue: 56, transactions: 28 },
  { label: "Agu", revenue: 36, transactions: 24 }
];

const topMedicines = [
  {
    name: "Paracetamol",
    meta: "28 terjual - Rp92jt",
    status: "Healthy",
    tone: "green",
    icon: Pill
  },
  {
    name: "Amoxicillin",
    meta: "14 terjual - Rp41jt",
    status: "Review",
    tone: "amber",
    icon: PackageCheck
  },
  {
    name: "Vitamin C",
    meta: "21 terjual - Rp18jt",
    status: "Critical",
    tone: "red",
    icon: ShieldCheck
  }
] as const;

function compactRupiah(value: number) {
  if (value >= 1_000_000) {
    return `Rp${Number(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1
    })}jt`;
  }

  return formatCurrency(value);
}

function statusClass(tone: "green" | "amber" | "red") {
  return {
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-500"
  }[tone];
}

function MetricCard({
  title,
  value,
  helper,
  trend,
  icon: Icon,
  variant = "soft",
  down = false
}: {
  title: string;
  value: string;
  helper: string;
  trend: string;
  icon: LucideIcon;
  variant?: "soft" | "orange";
  down?: boolean;
}) {
  const orange = variant === "orange";

  return (
    <article
      className={cn(
        "dashboard-enter relative min-w-0 overflow-hidden rounded-lg p-5 2xl:p-6",
        orange
          ? "bg-[#ff623d] text-white shadow-[0_24px_70px_rgba(255,98,61,.26)]"
          : "bg-[#f8f7f3] text-stone-950"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-sm font-black text-stone-500",
            orange && "text-white/82"
          )}
        >
          {title}
        </p>
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-stone-500",
            orange && "bg-white/20 text-white"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-4 break-words text-3xl font-black leading-none tracking-normal 2xl:text-4xl">
        {value}
      </p>
      <p
        className={cn(
          "mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 2xl:text-sm",
          down && "bg-red-100 text-red-500",
          orange && "bg-white text-emerald-700"
        )}
      >
        {trend}
      </p>
      <p className={cn("mt-3 text-xs font-semibold text-stone-500 2xl:text-sm", orange && "text-white/78")}>
        {helper}
      </p>
    </article>
  );
}

export default function DashboardPage() {
  const lowStock = obat.filter((item) => item.stokTersedia < item.stokMinimum);
  const totalStock = obat.reduce((sum, item) => sum + item.stokTersedia, 0);
  const stockTarget = Math.max(totalStock + 180, 800);
  const stockCoverage = Math.round((totalStock / stockTarget) * 100);
  const dailySales = Math.max(
    dashboardSummary.totalPenjualanHariIni * 163,
    dashboardSummary.totalPenjualanHariIni
  );
  const monthlySales = dailySales * 164;
  const transactionsToday = Math.max(
    dashboardSummary.jumlahTransaksiHariIni * 42,
    penjualan.length
  );
  const activeRecipes = resep.length + 17;
  const expiredSoon = stokBatches.filter(
    (item) => new Date(item.tanggalExpired) <= new Date("2026-09-07")
  );
  const categoryStats = kategoriObat.map((category) => {
    const categoryItems = obat.filter((item) => item.kategoriId === category.id);
    const categoryStock = categoryItems.reduce(
      (sum, item) => sum + item.stokTersedia,
      0
    );

    return {
      name: category.nama,
      percent: Math.min(
        92,
        Math.max(42, Math.round((categoryStock / Math.max(totalStock, 1)) * 100))
      )
    };
  });

  return (
    <div className="space-y-7">
      <section className="dashboard-enter flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="max-w-4xl text-4xl font-black leading-none tracking-normal text-[#20201d] md:text-5xl 2xl:text-6xl">
            Selamat pagi, Apotek Ananda
          </h1>
          <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-stone-500 2xl:text-lg 2xl:leading-8">
            Pantau kesehatan operasional apotek, temukan stok at-risk, cek
            efisiensi penjualan, dan susun prioritas optimasi dari satu command
            center.
          </p>
        </div>

        <div className="flex w-full items-center justify-between gap-3 rounded-full bg-white p-2 pl-5 text-sm shadow-[0_16px_50px_rgba(25,24,21,.08)] sm:w-auto">
          <span className="flex items-center gap-2 font-bold text-stone-500">
            <CalendarDays className="h-4 w-4 text-[#ff6a3d]" strokeWidth={2} />
            Periode aktif
          </span>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-[#20201d] px-5 py-3 font-black text-white"
          >
            Juli 2026
            <ChevronDown className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(340px,.86fr)_minmax(360px,.92fr)_minmax(500px,1.22fr)]">
        <article className="dashboard-enter rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(25,24,21,.08)] 2xl:p-7">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-base font-black text-stone-500">
                Revenue Apotek
              </p>
              <p className="mt-3 text-4xl font-black leading-none tracking-normal text-[#20201d] 2xl:text-5xl">
                {compactRupiah(dailySales)}
              </p>
              <span className="mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">
                naik 5% bulan ini
              </span>
            </div>
            <button
              type="button"
              className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-black text-stone-800"
            >
              IDR
              <ChevronDown className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href="/penjualan/kasir"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#20201d] px-4 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(25,24,21,.18)] active:translate-y-0 2xl:text-base"
            >
              <RefreshCw className="h-5 w-5" strokeWidth={2} />
              Input Data
            </Link>
            <Link
              href="/laporan/penjualan"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f8f7f3] px-4 py-4 text-sm font-black text-[#20201d] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(25,24,21,.08)] active:translate-y-0 2xl:text-base"
            >
              <BarChart3 className="h-5 w-5" strokeWidth={2} />
              Lihat Laporan
            </Link>
          </div>

          <div className="mt-7 rounded-lg bg-[#f8f7f3] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-stone-500">
                Obat | 24 item aktif
              </p>
              <Ellipsis className="h-5 w-5 text-stone-500" strokeWidth={2} />
            </div>

            <div className="mt-4 space-y-3">
              {topMedicines.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-[0_10px_30px_rgba(25,24,21,.04)]"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff0ea] text-[#ff6a3d]">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-[#20201d]">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-stone-500">
                        {item.meta}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "shrink-0 text-sm font-black",
                        statusClass(item.tone)
                      )}
                    >
                      {item.status}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <div className="dashboard-enter grid gap-4 rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(25,24,21,.08)] sm:grid-cols-2 xl:col-span-2 xl:col-start-1 xl:row-start-2 xl:grid-cols-4 2xl:col-span-1 2xl:col-start-auto 2xl:row-start-auto 2xl:grid-cols-2 2xl:gap-5 2xl:p-7">
          <MetricCard
            title="Total Revenue"
            value={compactRupiah(monthlySales)}
            trend="naik 7% bulan ini"
            helper="Semua kategori obat"
            icon={ArrowUpRight}
            variant="orange"
          />
          <MetricCard
            title="Biaya Operasional"
            value={compactRupiah(Math.round(monthlySales * 0.21))}
            trend="turun 5% bulan ini"
            helper="Pembelian dan operasional"
            icon={ReceiptText}
            down
          />
          <MetricCard
            title="Margin Kotor"
            value="38%"
            trend="naik 8% bulan ini"
            helper="Revenue / HPP"
            icon={PackageCheck}
          />
          <MetricCard
            title="Resep Aktif"
            value={String(activeRecipes)}
            trend="naik 4% bulan ini"
            helper="Diproses apoteker"
            icon={ClipboardCheck}
          />
        </div>

        <article className="dashboard-enter rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(25,24,21,.08)] xl:col-start-2 xl:row-start-1 2xl:col-start-auto 2xl:row-start-auto 2xl:p-7">
          <div>
            <h2 className="text-3xl font-black tracking-normal text-[#20201d]">
              Total Penjualan
            </h2>
            <p className="mt-2 text-base font-semibold text-stone-500">
              Revenue dan transaksi apotek dalam periode berjalan.
            </p>
          </div>

          <div className="mt-6 rounded-lg bg-[#f8f7f3] p-5 2xl:p-6">
            <div className="flex justify-end gap-6 text-sm font-black text-stone-500">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff6a3d]" />
                Revenue
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#20201d]" />
                Transaksi
              </span>
            </div>

            <div className="mt-8 flex h-[330px] items-end gap-3 2xl:h-64 2xl:gap-4">
              {monthlyBars.map((point, index) => (
                <div
                  key={point.label}
                  className="flex flex-1 flex-col items-center gap-3"
                >
                  <div className="flex h-[260px] w-full items-end justify-center gap-2 2xl:h-48">
                    <span
                      className="dashboard-bar dashboard-bar-orange w-6 rounded-t-lg 2xl:w-8"
                      style={{
                        height: `${point.revenue}%`,
                        animationDelay: `${index * 70}ms`
                      }}
                    />
                    <span
                      className="dashboard-bar w-6 rounded-t-lg bg-[#20201d] 2xl:w-8"
                      style={{
                        height: `${point.transactions}%`,
                        animationDelay: `${index * 70 + 80}ms`
                      }}
                    />
                  </div>
                  <span className="text-sm font-black text-stone-400">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        <article className="dashboard-enter rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(25,24,21,.08)] 2xl:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-normal text-[#20201d] 2xl:text-3xl">
                Stok Coverage
              </h2>
              <p className="mt-2 text-base font-semibold text-stone-500">
                Obat yang sudah memiliki data periode aktif.
              </p>
            </div>
            <span className="rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-black text-amber-700">
              {totalStock}/{stockTarget}
            </span>
          </div>
          <div className="mt-8 h-4 overflow-hidden rounded-full bg-[#eeece7]">
            <div
              className="dashboard-fill h-full rounded-full bg-[#ff6a3d]"
              style={{ width: `${stockCoverage}%` }}
            />
          </div>
          <div className="mt-5 flex items-center justify-between text-sm font-black text-stone-500">
            <span>{stockCoverage}% complete</span>
            <span>{lowStock.length + expiredSoon.length} item perlu dicek</span>
          </div>
        </article>

        <article className="dashboard-enter rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(25,24,21,.08)] 2xl:p-7">
          <h2 className="text-2xl font-black tracking-normal text-[#20201d] 2xl:text-3xl">
            Kesehatan Stok
          </h2>
          <p className="mt-2 text-base font-semibold text-stone-500">
            Ringkasan performa kategori obat.
          </p>
          <div className="mt-7 space-y-5">
            {categoryStats.map((item) => (
              <div key={item.name} className="grid grid-cols-[86px_1fr_44px] items-center gap-4">
                <span className="font-black text-[#20201d]">{item.name}</span>
                <div className="h-3 overflow-hidden rounded-full bg-[#eeece7]">
                  <div
                    className="dashboard-fill h-full rounded-full bg-[#ff6a3d]"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <span className="text-right font-black text-stone-500">
                  {item.percent}%
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-enter relative overflow-hidden rounded-lg bg-[#20201d] p-6 text-white shadow-[0_24px_70px_rgba(25,24,21,.18)] xl:col-span-2 2xl:col-span-1 2xl:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,106,61,.35),transparent_32%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-5">
              <div>
                <span className="rounded-full bg-[#e9fff3] px-4 py-2 text-xs font-black text-emerald-700">
                  READY
                </span>
                <h2 className="mt-8 text-3xl font-black tracking-normal">
                  AI Insight Apotek
                </h2>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ff6a3d] text-white">
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </span>
            </div>
            <p className="mt-4 text-base font-semibold leading-7 text-white/72">
              Prioritaskan restock antibiotik dan review batch Ibuprofen. Pola
              penjualan analgesik sedang kuat untuk akhir pekan.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-white/[0.08] p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-emerald-300">
                  <TrendingUp className="h-4 w-4" strokeWidth={2} />
                  <span className="text-sm font-black">Peluang</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  Tambah stok Paracetamol sebelum permintaan naik.
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.08] p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-[#ffb199]">
                  <TrendingDown className="h-4 w-4" strokeWidth={2} />
                  <span className="text-sm font-black">Risiko</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  Amoxicillin berada di bawah stok minimum.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
