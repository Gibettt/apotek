import { describe, expect, it } from "vitest";
import { biayaService } from "./biayaService";

describe("biayaService", () => {
  it("menolak jumlah biaya nol atau negatif", async () => {
    await expect(
      biayaService.create({
        tanggal: "2026-07-10",
        akunId: "akun-beban-listrik",
        namaBiaya: "Tagihan listrik",
        jumlah: 0,
        metodeBayar: "tunai"
      })
    ).rejects.toThrow("Jumlah biaya harus lebih besar dari nol");
  });

  it("menolak biaya tanpa akun beban", async () => {
    await expect(
      biayaService.create({
        tanggal: "2026-07-10",
        akunId: "",
        namaBiaya: "Tagihan listrik",
        jumlah: 100000,
        metodeBayar: "tunai"
      })
    ).rejects.toThrow("Akun beban wajib dipilih");
  });

  it("menolak nama biaya kosong", async () => {
    await expect(
      biayaService.create({
        tanggal: "2026-07-10",
        akunId: "akun-beban-listrik",
        namaBiaya: "   ",
        jumlah: 100000,
        metodeBayar: "tunai"
      })
    ).rejects.toThrow("Nama biaya wajib diisi");
  });

  it("mencatat biaya valid, bisa dicari, lalu dibatalkan", async () => {
    const id = await biayaService.create({
      tanggal: "2026-07-11",
      akunId: "akun-beban-listrik",
      namaBiaya: "Tagihan listrik Juli",
      jumlah: 1250000,
      metodeBayar: "transfer"
    });

    const created = await biayaService.getById(id);
    expect(created?.namaBiaya).toBe("Tagihan listrik Juli");
    expect(created?.jumlah).toBe(1250000);
    expect(created?.dibatalkanAt).toBeUndefined();

    const found = await biayaService.list({ search: "listrik", perPage: 5 });
    expect(found.data.some((item) => item.id === id)).toBe(true);

    await biayaService.void(id);
    const afterVoid = await biayaService.getById(id);
    expect(afterVoid?.dibatalkanAt).toEqual(expect.any(String));
  });
});
