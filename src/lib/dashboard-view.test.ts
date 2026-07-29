import { describe, expect, it } from "vitest";
import { buildDashboardView } from "@/lib/dashboard-view";
import { kategoriService } from "@/services/kategoriService";
import { obatService } from "@/services/obatService";
import { penjualanService } from "@/services/penjualanService";

function dateInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

describe("buildDashboardView", () => {
  it("pulls the chart and medicine table from real service data, not mock numbers", async () => {
    const kategori = await kategoriService.list({ perPage: 10 });
    const antibiotikId = kategori.data.find((item) => item.kode === "antibiotik")?.id;
    const vitaminId = kategori.data.find((item) => item.kode === "vitamin")?.id;
    expect(antibiotikId).toBeDefined();
    expect(vitaminId).toBeDefined();

    const aktif = await obatService.create({
      kode: `DASH-${Date.now()}-1`,
      nama: "Dashboard Test Aktif",
      kategoriId: antibiotikId,
      stokMinimum: 10,
      stokAwal: 5,
      hargaJual: 1000,
      status: true
    });

    const nonaktif = await obatService.create({
      kode: `DASH-${Date.now()}-2`,
      nama: "Dashboard Test Nonaktif",
      kategoriId: antibiotikId,
      stokMinimum: 10,
      stokAwal: 50,
      hargaJual: 2000,
      status: false
    });

    const bedaKategori = await obatService.create({
      kode: `DASH-${Date.now()}-3`,
      nama: "Dashboard Test Vitamin",
      kategoriId: vitaminId,
      stokMinimum: 10,
      stokAwal: 50,
      hargaJual: 1500,
      status: true
    });

    await penjualanService.checkout({
      items: [
        {
          barangId: aktif.id,
          kode: aktif.kode,
          nama: aktif.nama,
          hargaJual: 1000,
          stokTersedia: aktif.stokTersedia,
          membutuhkanResep: false,
          quantity: 3
        }
      ],
      metodePembayaran: "tunai",
      bayar: 3000
    });

    const view = await buildDashboardView({ period: "7", category: "semua" });

    expect(view.chart).toHaveLength(7);
    expect(view.chart.at(-1)?.revenue).toBeGreaterThanOrEqual(3000);
    expect(view.activeMedicines.some((item) => item.id === aktif.id)).toBe(true);
    expect(view.activeMedicines.some((item) => item.id === nonaktif.id)).toBe(false);
    expect(view.lowStockCount).toBeGreaterThanOrEqual(1);

    const filtered = await buildDashboardView({ period: "7", category: "antibiotik" });
    expect(filtered.activeMedicines.some((item) => item.id === aktif.id)).toBe(true);
    expect(filtered.activeMedicines.some((item) => item.id === bedaKategori.id)).toBe(false);

    const today = dateInputValue(new Date());
    const daily = await buildDashboardView({
      period: "7",
      category: "semua",
      startDate: today,
      endDate: today
    });
    expect(daily.chart).toHaveLength(1);
    expect(daily.chart[0].revenue).toBeGreaterThanOrEqual(3000);
  });
});
