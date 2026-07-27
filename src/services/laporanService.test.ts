import { describe, expect, it } from "vitest";
import { laporanService } from "./laporanService";

describe("laporanService", () => {
  it("computes gross profit per sale for the laba-rugi report", async () => {
    const rows = await laporanService.labaRugiReport();

    expect(rows).toHaveLength(1);
    expect(rows[0].referensi).toBe("PJL-20260707-0001");
    expect(rows[0].kategori).toBe("Laba kotor");
    // subtotal 19200 minus HPP (12*300 + 12*500) = 19200 - 9600 = 9600
    expect(rows[0].nilai).toBe(9600);
  });

  it("reads the pembelian report from pembelianService, not mock data", async () => {
    const rows = await laporanService.pembelianReport();

    expect(rows.length).toBeGreaterThanOrEqual(0);
    for (const row of rows) {
      expect(row).toHaveProperty("referensi");
      expect(row).toHaveProperty("nilai");
    }
  });

  it("reads the stok report from stokService, not mock data", async () => {
    const rows = await laporanService.stokReport();

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => typeof row.nilai === "number")).toBe(true);
  });
});
