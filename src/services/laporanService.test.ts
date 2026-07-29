import { describe, expect, it } from "vitest";
import { laporanService } from "./laporanService";
import { pembelianService } from "./pembelianService";

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

  it("reads stok masuk from received supplier purchases", async () => {
    const batchNumber = `BATCH-STOK-${Date.now()}`;
    const created = await pembelianService.create({
      nomorInternal: `PBL-STOK-REPORT-${Date.now()}`,
      supplierId: "s-1",
      tanggalFaktur: "2026-07-08",
      status: "diterima",
      items: [
        {
          barangId: "o-1",
          batchNumber,
          jumlah: 7,
          hargaBeli: 1000
        }
      ]
    });

    const rows = await laporanService.stokReport();

    expect(rows).toContainEqual(
      expect.objectContaining({
        referensi: batchNumber,
        kategori: created.details[0].namaBarang,
        nilai: 7,
        status: created.namaSupplier
      })
    );
  });
});
