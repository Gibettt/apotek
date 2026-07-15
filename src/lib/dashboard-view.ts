import { kategoriBarang, obat, salesChart } from "@/lib/mock-data";

export type DashboardPeriod = "7" | "30" | "90";
export type DashboardCategory = "semua" | "analgesik" | "antibiotik" | "vitamin";

type DashboardSelection = {
  period: DashboardPeriod;
  category: DashboardCategory;
};

const periodMultipliers: Record<DashboardPeriod, number> = {
  "7": 1,
  "30": 4.28,
  "90": 12.86
};

const categoryWeightBySlug: Record<Exclude<DashboardCategory, "semua">, number> = {
  analgesik: 0.32,
  antibiotik: 0.36,
  vitamin: 0.4
};

const transactionBase = [28, 36, 31, 42, 38, 48, 34];

export function getCategoryId(category: DashboardCategory) {
  if (category === "semua") return null;
  return kategoriBarang.find((entry) => entry.kode === category)?.id ?? null;
}

export function buildDashboardView({ period, category }: DashboardSelection) {
  const categoryId = getCategoryId(category);
  const multiplier = periodMultipliers[period];
  const selectedMedicines = obat.filter(
    (item) => categoryId === null || item.kategoriId === categoryId
  );
  const categoryWeight = category === "semua" ? 1 : categoryWeightBySlug[category];

  const chart = salesChart.map((point, index) => {
    const revenue = Math.round(point.penjualan * multiplier * categoryWeight);
    const profit = Math.round((point.laba ?? point.penjualan * 0.34) * multiplier * categoryWeight);

    return {
      label: point.label,
      revenue,
      profit,
      transactions: Math.max(1, Math.round(transactionBase[index]! * multiplier * categoryWeight))
    };
  });

  const revenue = chart.reduce((total, point) => total + point.revenue, 0);
  const profit = chart.reduce((total, point) => total + point.profit, 0);
  const transactions = chart.reduce((total, point) => total + point.transactions, 0);
  const lowStockItems = selectedMedicines.filter(
    (item) => item.stokTersedia < item.stokMinimum
  );
  const totalStock = selectedMedicines.reduce(
    (total, item) => total + item.stokTersedia,
    0
  );

  return {
    chart,
    revenue,
    profit,
    transactions,
    lowStockCount: lowStockItems.length,
    totalStock,
    activeMedicines: selectedMedicines.map((item) => ({
      id: item.id,
      name: item.nama,
      category: kategoriBarang.find((entry) => entry.id === item.kategoriId)?.nama ?? "Lainnya",
      stock: item.stokTersedia,
      minimumStock: item.stokMinimum,
      price: item.hargaAktif?.hargaJual ?? 0,
      status: item.stokTersedia < item.stokMinimum ? "Perlu restock" : "Tersedia"
    }))
  };
}
