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
  includeSales?: boolean;
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
  const days =
    Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { key: date.toDateString(), label: chartLabel(date, days), revenue: 0, profit: 0 };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

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
    }
  }

  const lowStockCount = activeMedicinesSource.filter(
    (item) => isLowStock(item.stokTersedia)
  ).length;

  return {
    chart: buckets.map(({ label, revenue, profit }) => ({ label, revenue, profit })),
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
