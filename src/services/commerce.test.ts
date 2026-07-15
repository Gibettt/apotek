import { describe, expect, it } from "vitest";
import { obatService } from "./obatService";
import { pembelianService } from "./pembelianService";
import { penjualanService } from "./penjualanService";
import { resepService } from "./resepService";
import { laporanService } from "./laporanService";

describe("commerce services", () => {
  it("starts medicines without dummy data, then creates and deletes a real record shape", async () => {
    const list = await obatService.list({ search: "vitamin", perPage: 5 });
    const created = await obatService.create({
      kode: "OBT-9999",
      nama: "Test Obat",
      hargaBeli: 500,
      hargaJual: 1000,
      stokMinimum: 5,
      stokAwal: 12,
      status: true
    });
    const createdList = await obatService.list({ search: "test", perPage: 5 });
    const results = await obatService.search("test");
    const detail = await obatService.getById(created.id);

    expect(list.total).toBe(0);
    expect(created.id).toEqual(expect.any(String));
    expect(createdList.total).toBe(1);
    expect(results[0]?.kode).toBe("OBT-9999");
    expect(detail?.nama).toBe("Test Obat");
    expect(detail?.stokTersedia).toBe(12);

    await obatService.delete(created.id);
    const afterDelete = await obatService.list({ search: "test", perPage: 5 });

    expect(afterDelete.total).toBe(0);
  });

  it("lists and reads sales history", async () => {
    const list = await penjualanService.list({ search: "PJL" });
    const detail = await penjualanService.getById("pj-1");

    expect(list.total).toBe(1);
    expect(detail?.nomorInvoice).toBe("PJL-20260707-0001");
  });

  it("builds a sales report with date and payment filters", async () => {
    const report = await laporanService.salesReport({
      startDate: "2026-07-07",
      endDate: "2026-07-07",
      metodePembayaran: "tunai"
    });
    const emptyReport = await laporanService.salesReport({
      startDate: "2026-07-07",
      endDate: "2026-07-07",
      metodePembayaran: "transfer"
    });

    expect(report.rows).toHaveLength(1);
    expect(report.summary.totalRevenue).toBe(19200);
    expect(report.summary.totalItems).toBe(24);
    expect(emptyReport.rows).toHaveLength(0);
  });

  it("creates a purchase order and can receive it", async () => {
    const created = await pembelianService.create({
      nomorInternal: "PBL-TEST-0001",
      supplierId: "s-1",
      tanggalFaktur: "2026-07-08",
      status: "draft",
      items: [
        {
          barangId: "o-1",
          batchNumber: "BATCH-TEST",
          tanggalExpired: "2027-07-08",
          jumlah: 3,
          hargaBeli: 2000,
          diskonNominal: 500
        }
      ]
    });

    const list = await pembelianService.list({
      search: "PBL-TEST-0001",
      perPage: 5
    });
    const received = await pembelianService.receive(created.id);

    expect(created.grandTotal).toBe(5500);
    expect(created.status).toBe("draft");
    expect(list.total).toBe(1);
    expect(received.status).toBe("diterima");
  });

  it("creates a prescription and updates its workflow status", async () => {
    const created = await resepService.create({
      nomorResep: "RSP-TEST-0001",
      pelangganNama: "Pelanggan Resep Test",
      pelangganTelepon: "0800000000",
      namaDokter: "dr. Test",
      noSipDokter: "SIP-TEST",
      tanggalResep: "2026-07-08",
      status: "menunggu",
      details: [
        {
          barangId: "o-1",
          aturanPakai: "3x sehari setelah makan",
          jumlah: 6,
          catatan: "Habiskan"
        }
      ]
    });

    const list = await resepService.list({
      search: "RSP-TEST-0001",
      perPage: 5
    });
    const processed = await resepService.updateStatus(created.id, "diproses");
    const completed = await resepService.updateStatus(created.id, "selesai");

    expect(created.status).toBe("menunggu");
    expect(created.namaPelanggan).toBe("Pelanggan Resep Test");
    expect(created.details[0].aturanPakai).toBe("3x sehari setelah makan");
    expect(list.total).toBe(1);
    expect(processed.status).toBe("diproses");
    expect(completed.status).toBe("selesai");
  });

  it("creates a sale with subtotal and change", async () => {
    const sale = await penjualanService.checkout({
      metodePembayaran: "tunai",
      bayar: 10000,
      items: [
        {
          barangId: "o-1",
          kode: "OBT-0001",
          nama: "Paracetamol 500mg",
          hargaJual: 650,
          stokTersedia: 10,
          membutuhkanResep: false,
          quantity: 2
        }
      ]
    });

    expect(sale.grandTotal).toBe(1300);
    expect(sale.kembalian).toBe(8700);
    expect(sale.details[0].hargaJual).toBe(650);
  });
});
