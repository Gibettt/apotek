import { kategoriService } from "@/services/kategoriService";
import { obatService } from "@/services/obatService";
import { penjualanService } from "@/services/penjualanService";

export type DashboardPeriod = "7" | "30" | "90";
export type DashboardCategory = "semua" | "analgesik" | "antibiotik" | "vitamin";

type DashboardSelection = {
  period: DashboardPeriod;
  category: DashboardCategory;
};

const weekDayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function dayLabel(date: Date) {
  return weekDayLabels[(date.getDay() + 6) % 7];
}

async function resolveCategoryId(category: DashboardCategory) {
  if (category === "semua") {
    return null;
  }

  const { data } = await kategoriService.list({ perPage: 200 });
  return data.find((entry) => entry.kode === category)?.id ?? null;
}

export async function buildDashboardView({ period, category }: DashboardSelection) {
  const days = Number(period);
  const categoryId = await resolveCategoryId(category);

  const [obatResult, penjualanResult] = await Promise.all([
    obatService.list({ perPage: 500 }),
    penjualanService.list({ perPage: 1000 })
  ]);

  const activeMedicinesSource = obatResult.data.filter(
    (item) => item.status && (categoryId === null || item.kategoriId === categoryId)
  );
  const kategoriIdByBarang = Object.fromEntries(
    obatResult.data.map((item) => [item.id, item.kategoriId])
  );

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(since);
    date.setDate(since.getDate() + index);
    return { key: date.toDateString(), label: dayLabel(date), revenue: 0, profit: 0 };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

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

  const lowStockCount = activeMedicinesSource.filter(
    (item) => item.stokTersedia < item.stokMinimum
  ).length;

  return {
    chart: buckets.map(({ label, revenue, profit }) => ({ label, revenue, profit })),
    lowStockCount,
    activeMedicines: activeMedicinesSource.map((item) => ({
      id: item.id,
      name: item.nama,
      category: item.kategoriNama ?? "Lainnya",
      stock: item.stokTersedia,
      minimumStock: item.stokMinimum,
      price: item.hargaAktif?.hargaJual ?? 0,
      status: item.stokTersedia < item.stokMinimum ? "Perlu restock" : "Tersedia"
    }))
  };
}
