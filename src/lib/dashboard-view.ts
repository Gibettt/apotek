import { kategoriService } from "@/services/kategoriService";
import { obatService } from "@/services/obatService";
import { penjualanService } from "@/services/penjualanService";
import { isLowStock, LOW_STOCK_THRESHOLD } from "@/lib/stockRules";

export type DashboardPeriod = "7" | "30" | "90";
export type DashboardCategory = "semua" | "analgesik" | "antibiotik" | "vitamin";

type DashboardSelection = {
  period: DashboardPeriod;
  category: DashboardCategory;
  startDate?: string;
  endDate?: string;
  topSellingMonth?: string;
  includeSales?: boolean;
};

type TopSellingBucket = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  transactions: Set<string>;
};

const weekDayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function dayLabel(date: Date) {
  return weekDayLabels[(date.getDay() + 6) % 7];
}

function chartLabel(date: Date, totalDays: number) {
  return totalDays <= 7 ? dayLabel(date) : `${date.getDate()}/${date.getMonth() + 1}`;
}

function parseInputDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function chartDateRange(period: DashboardPeriod, startDate?: string, endDate?: string) {
  const fallbackEnd = new Date();
  fallbackEnd.setHours(0, 0, 0, 0);

  const fallbackStart = new Date(fallbackEnd);
  fallbackStart.setDate(fallbackEnd.getDate() - (Number(period) - 1));

  const start = parseInputDate(startDate) ?? fallbackStart;
  const end = parseInputDate(endDate) ?? fallbackEnd;

  return start <= end ? { start, end } : { start: end, end: start };
}

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function monthRangeFromInput(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return monthRange();
  }

  const [year, month] = value.split("-").map(Number);
  return monthRange(new Date(year, month - 1, 1));
}

function isDateInRange(value: string, start: Date, end: Date) {
  const date = new Date(value);
  const time = date.getTime();

  return Number.isFinite(time) && time >= start.getTime() && time <= end.getTime();
}

async function resolveCategoryId(category: DashboardCategory) {
  if (category === "semua") {
    return null;
  }

  const { data } = await kategoriService.list({ perPage: 200 });
  return data.find((entry) => entry.kode === category)?.id ?? null;
}

export async function buildDashboardView({
  period,
  category,
  startDate,
  endDate,
  topSellingMonth,
  includeSales = true
}: DashboardSelection) {
  const categoryId = await resolveCategoryId(category);

  const obatResult = await obatService.list({ perPage: 500 });

  const activeMedicinesSource = obatResult.data.filter(
    (item) => item.status && (categoryId === null || item.kategoriId === categoryId)
  );
  const kategoriIdByBarang = Object.fromEntries(
    obatResult.data.map((item) => [item.id, item.kategoriId])
  );

  const { start, end } = chartDateRange(period, startDate, endDate);
  const selectedTopSellingMonth = monthRangeFromInput(topSellingMonth);
  const days =
    Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { key: date.toDateString(), label: chartLabel(date, days), revenue: 0, profit: 0 };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const productById = new Map(activeMedicinesSource.map((item) => [item.id, item]));
  const topSellingByBarang = new Map<string, TopSellingBucket>();

  if (includeSales) {
    const penjualanResult = await penjualanService.list({ perPage: 1000 });

    for (const sale of penjualanResult.data) {
      const bucket = bucketByKey.get(new Date(sale.tanggal).toDateString());
      if (!bucket) {
        continue;
      }

      for (const detail of sale.details ?? []) {
        if (categoryId !== null && kategoriIdByBarang[detail.barangId] !== categoryId) {
          continue;
        }

        bucket.revenue += detail.subtotal;
        bucket.profit += detail.subtotal - detail.hargaPokok * detail.jumlah;
      }

      if (
        sale.status !== "selesai" ||
        !isDateInRange(
          sale.tanggal,
          selectedTopSellingMonth.start,
          selectedTopSellingMonth.end
        )
      ) {
        continue;
      }

      for (const detail of sale.details ?? []) {
        const product = productById.get(detail.barangId);
        if (!product) {
          continue;
        }

        const current = topSellingByBarang.get(detail.barangId) ?? {
          id: detail.barangId,
          name: detail.namaBarang || product.nama,
          category: product.kategoriNama ?? "Lainnya",
          quantity: 0,
          revenue: 0,
          transactions: new Set<string>()
        };

        current.quantity += detail.jumlah;
        current.revenue += detail.subtotal;
        current.transactions.add(sale.id);
        topSellingByBarang.set(detail.barangId, current);
      }
    }
  }

  const lowStockCount = activeMedicinesSource.filter(
    (item) => isLowStock(item.stokTersedia)
  ).length;

  return {
    chart: buckets.map(({ label, revenue, profit }) => ({ label, revenue, profit })),
    topSellingItems: [...topSellingByBarang.values()]
      .sort((first, second) => {
        if (second.quantity !== first.quantity) {
          return second.quantity - first.quantity;
        }

        return second.revenue - first.revenue;
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        revenue: item.revenue,
        transactionCount: item.transactions.size,
        suggestedPurchase: Math.ceil(item.quantity * 1.2)
      })),
    lowStockCount,
    activeMedicines: activeMedicinesSource.map((item) => ({
      id: item.id,
      name: item.nama,
      category: item.kategoriNama ?? "Lainnya",
      stock: item.stokTersedia,
      minimumStock: LOW_STOCK_THRESHOLD,
      price: item.hargaAktif?.hargaJual ?? 0,
      status: isLowStock(item.stokTersedia) ? "Perlu restock" : "Tersedia"
    }))
  };
}
