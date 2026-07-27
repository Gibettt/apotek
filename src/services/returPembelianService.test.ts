import { describe, expect, it } from "vitest";
import { returPembelianService } from "./returPembelianService";

describe("returPembelianService", () => {
  it("rejects a retur with no items", async () => {
    await expect(
      returPembelianService.create({
        supplierId: "s-1",
        tanggal: "2026-07-10",
        alasan: "Barang rusak",
        items: []
      })
    ).rejects.toThrow("Minimal satu item obat wajib diisi");
  });

  it("creates a draft retur, lists it, then posts it", async () => {
    const created = await returPembelianService.create({
      supplierId: "s-1",
      tanggal: "2026-07-10",
      alasan: "Barang rusak",
      items: [{ barangId: "o-1", jumlah: 5, hargaBeli: 300 }]
    });

    expect(created.status).toBe("draft");
    expect(created.total).toBe(1500);
    expect(created.details[0].subtotal).toBe(1500);

    const list = await returPembelianService.list({ search: created.nomor, perPage: 5 });
    expect(list.total).toBe(1);

    const posted = await returPembelianService.post(created.id);
    expect(posted.status).toBe("posted");

    const postedAgain = await returPembelianService.post(created.id);
    expect(postedAgain.status).toBe("posted");
  });

  it("refuses to post a retur that's already been cancelled", async () => {
    const created = await returPembelianService.create({
      supplierId: "s-1",
      tanggal: "2026-07-10",
      alasan: "Mendekati expired",
      status: "dibatalkan",
      items: [{ barangId: "o-2", jumlah: 2, hargaBeli: 850 }]
    });

    await expect(returPembelianService.post(created.id)).rejects.toThrow(
      "Retur yang sudah dibatalkan tidak bisa diposting"
    );
  });
});
