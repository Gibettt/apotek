import { describe, expect, it } from "vitest";
import { stokService } from "./stokService";

describe("stokService", () => {
  it("stok masuk records a new mutation and increases stock", async () => {
    await stokService.masuk({ barangId: "o-1", qty: 10, keterangan: "Retur pelanggan" });

    const mutasi = await stokService.mutations({ search: "Paracetamol", perPage: 50 });
    const entry = mutasi.data.find((item) => item.tipeMutasi === "masuk" && item.qtyMasuk === 10);

    expect(entry).toBeDefined();
    expect(entry?.keterangan).toBe("Retur pelanggan");
  });

  it("stok keluar rejects an amount larger than what's available", async () => {
    await expect(
      stokService.keluar({ barangId: "o-2", qty: 999999, keterangan: "Rusak" })
    ).rejects.toThrow("Stok tidak mencukupi");
  });

  it("stok keluar requires a reason", async () => {
    await expect(stokService.keluar({ barangId: "o-2", qty: 1, keterangan: "" })).rejects.toThrow(
      "Keterangan/alasan"
    );
  });

  it("stok keluar decrements stock and records the mutation", async () => {
    await stokService.keluar({ barangId: "o-2", qty: 5, keterangan: "Rusak" });

    const mutasi = await stokService.mutations({ search: "Amoxicillin", perPage: 50 });
    const entry = mutasi.data.find((item) => item.tipeMutasi === "keluar" && item.qtyKeluar === 5);

    expect(entry).toBeDefined();
    expect(entry?.keterangan).toBe("Rusak");
  });

  it("opname is a no-op when stok fisik matches stok sistem", async () => {
    const batches = await stokService.list({ search: "Ibuprofen", perPage: 50 });
    const stokSistem = batches.data.reduce((sum, item) => sum + item.qty, 0);
    const before = await stokService.mutations({ search: "Ibuprofen", perPage: 50 });

    const result = await stokService.opname({ barangId: "o-4", stokFisik: stokSistem });

    const after = await stokService.mutations({ search: "Ibuprofen", perPage: 50 });
    expect(result.selisih).toBe(0);
    expect(after.data.length).toBe(before.data.length);
  });

  it("opname records the deficit when stok fisik is below stok sistem", async () => {
    const batches = await stokService.list({ search: "Ibuprofen", perPage: 50 });
    const stokSistem = batches.data.reduce((sum, item) => sum + item.qty, 0);

    const result = await stokService.opname({ barangId: "o-4", stokFisik: stokSistem - 10 });

    expect(result.selisih).toBe(-10);

    const mutasi = await stokService.mutations({ search: "Ibuprofen", perPage: 50 });
    const entry = mutasi.data.find(
      (item) => item.tipeMutasi === "opname" && item.saldoAkhir === stokSistem - 10
    );

    expect(entry).toBeDefined();
    expect(entry?.qtyKeluar).toBe(10);
  });
});
