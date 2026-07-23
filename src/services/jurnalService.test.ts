import { describe, expect, it } from "vitest";
import { jurnalService } from "./jurnalService";

const balancedDetails = [
  { akunId: "akun-kas", debit: 500000, kredit: 0 },
  { akunId: "akun-penjualan", debit: 0, kredit: 500000 }
];

const unbalancedDetails = [
  { akunId: "akun-kas", debit: 750000, kredit: 0 },
  { akunId: "akun-penjualan", debit: 0, kredit: 500000 }
];

describe("jurnalService", () => {
  it("menolak jurnal dengan kurang dari dua baris akun", async () => {
    await expect(
      jurnalService.create({
        tanggal: "2026-07-10",
        deskripsi: "Baris tunggal",
        details: [{ akunId: "akun-kas", debit: 100000, kredit: 0 }]
      })
    ).rejects.toThrow("Jurnal minimal harus mempunyai dua baris akun.");
  });

  it("menyimpan jurnal seimbang sebagai draft lalu bisa diposting", async () => {
    const id = await jurnalService.create({
      tanggal: "2026-07-10",
      nomorReferensi: "INV-001",
      deskripsi: "Penjualan tunai harian",
      details: balancedDetails
    });

    const created = await jurnalService.getById(id);
    expect(created?.status).toBe("draft");
    expect(created?.totalDebit).toBe(500000);
    expect(created?.totalKredit).toBe(500000);

    await jurnalService.post(id);
    const posted = await jurnalService.getById(id);
    expect(posted?.status).toBe("diposting");
    expect(posted?.postedAt).toEqual(expect.any(String));
  });

  it("menolak posting jurnal yang belum seimbang", async () => {
    const id = await jurnalService.create({
      tanggal: "2026-07-11",
      deskripsi: "Penyesuaian belum seimbang",
      details: unbalancedDetails
    });

    const draft = await jurnalService.getById(id);
    expect(draft?.status).toBe("draft");

    await expect(jurnalService.post(id)).rejects.toThrow(
      "Jurnal belum seimbang, tidak dapat diposting"
    );
  });

  it("bisa mengubah dan menghapus jurnal yang masih draft", async () => {
    const id = await jurnalService.create({
      tanggal: "2026-07-12",
      deskripsi: "Draft yang akan diubah",
      details: balancedDetails
    });

    await jurnalService.updateDraft(id, {
      tanggal: "2026-07-12",
      deskripsi: "Draft sudah direvisi",
      details: balancedDetails
    });

    const updated = await jurnalService.getById(id);
    expect(updated?.deskripsi).toBe("Draft sudah direvisi");

    await jurnalService.deleteDraft(id);
    const afterDelete = await jurnalService.getById(id);
    expect(afterDelete).toBeNull();
  });

  it("menemukan jurnal lewat pencarian nomor/keterangan", async () => {
    const id = await jurnalService.create({
      tanggal: "2026-07-13",
      deskripsi: "Pembayaran listrik bulan Juli",
      details: balancedDetails
    });

    const created = await jurnalService.getById(id);
    const found = await jurnalService.list({ search: created!.nomor, perPage: 5 });

    expect(found.total).toBeGreaterThanOrEqual(1);
    expect(found.data.some((item) => item.id === id)).toBe(true);
  });
});
