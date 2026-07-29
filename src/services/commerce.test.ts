import { describe, expect, it, vi } from "vitest";
import { obatService } from "./obatService";
import { buildPembelianJurnalDetails, pembelianService } from "./pembelianService";
import { buildPenjualanJurnalDetails, penjualanService, resolveCheckoutItems, resolveKasAkunKode, resolvePenjualanDetailAmounts, resolvePenjualanGrandTotalForDisplay } from "./penjualanService";
import { resepService } from "./resepService";
import { resolveReturStockQty, returPenjualanService } from "./returPenjualanService";
import { laporanService } from "./laporanService";

function sumBy<T>(rows: T[], pick: (row: T) => number) {
  return rows.reduce((sum, row) => sum + pick(row), 0);
}

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

  it("saves purchase unit conversion for the next purchase", async () => {
    await pembelianService.create({
      nomorInternal: "PBL-TEST-KONV-0001",
      supplierId: "s-1",
      tanggalFaktur: "2026-07-08",
      status: "draft",
      items: [
        {
          barangId: "o-1",
          satuanId: "sat-strip",
          satuanDasarId: "sat-kaplet",
          konversi: 10,
          jumlah: 50,
          hargaBeli: 200
        }
      ]
    });

    const conversions = await pembelianService.listKonversiSatuan();

    expect(conversions).toContainEqual({
      barangId: "o-1",
      satuanDariId: "sat-strip",
      satuanKeId: "sat-kaplet",
      nilaiKonversi: 10
    });
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

  it("resolves checkout cost basis from the active price, not the selling price", () => {
    const resolved = resolveCheckoutItems(
      [
        {
          barangId: "o-1",
          kode: "OBT-0001",
          nama: "Paracetamol 500mg",
          hargaJual: 650,
          stokTersedia: 10,
          membutuhkanResep: false,
          quantity: 2
        }
      ],
      { "o-1": { hargaBeli: 300, hargaJual: 650 } }
    );

    expect(resolved[0].hargaPokok).toBe(300);
    expect(resolved[0].hargaPokok).not.toBe(resolved[0].hargaJual);
  });

  it("keeps the cart sell price when the active sell price is zero", () => {
    const resolved = resolveCheckoutItems(
      [
        {
          barangId: "o-1",
          kode: "OBT-0001",
          nama: "Paracetamol 500mg",
          hargaJual: 650,
          stokTersedia: 10,
          membutuhkanResep: false,
          quantity: 2
        }
      ],
      { "o-1": { hargaBeli: 300, hargaJual: 0 } }
    );

    expect(resolved[0].hargaJual).toBe(650);
    expect(resolved[0].hargaPokok).toBe(300);
  });

  it("keeps eceran sell price and scales cost basis to the eceran unit", () => {
    const resolved = resolveCheckoutItems(
      [
        {
          barangId: "o-1",
          kode: "OBT-0001",
          nama: "Paracetamol 500mg",
          satuanId: "sat-tablet",
          satuanNama: "tablet",
          tipeHarga: "eceran",
          stockQtyPerUnit: 0.1,
          hargaJual: 1000,
          stokTersedia: 10,
          membutuhkanResep: false,
          quantity: 5
        }
      ],
      { "o-1": { hargaBeli: 3000, hargaJual: 6500 } }
    );

    expect(resolved[0].hargaJual).toBe(1000);
    expect(resolved[0].hargaPokok).toBe(300);
    expect(resolved[0].stockQuantity).toBe(0.5);
  });

  it("uses paid amount minus change when old sales are missing grand total", () => {
    expect(
      resolvePenjualanGrandTotalForDisplay(
        {
          grand_total: 0,
          bayar_total: 100000,
          kembalian: 40000,
          status_bayar: "lunas"
        },
        []
      )
    ).toBe(60000);
  });

  it("uses the non-zero master sell price for old zero-value sale details", () => {
    expect(
      resolvePenjualanDetailAmounts(
        { qty: 3, harga_jual: 0, subtotal: 0 },
        20000
      )
    ).toEqual({ jumlah: 3, hargaJual: 20000, subtotal: 60000 });
  });

  it("books a balanced jurnal for a cash sale with cost of goods", () => {
    const details = buildPenjualanJurnalDetails({
      grandTotal: 19500,
      totalHpp: 9000,
      nomorInvoice: "PJL-TEST-0001",
      akunIds: { kas: "kas-1", pendapatan: "pendapatan-1", persediaan: "persediaan-1", hpp: "hpp-1" }
    });

    expect(sumBy(details, (row) => row.debit)).toBe(sumBy(details, (row) => row.kredit));
    expect(details).toHaveLength(4);
  });

  it("books a balanced jurnal for a sale with zero cost basis (no HPP line)", () => {
    const details = buildPenjualanJurnalDetails({
      grandTotal: 19500,
      totalHpp: 0,
      nomorInvoice: "PJL-TEST-0002",
      akunIds: { kas: "kas-1", pendapatan: "pendapatan-1", persediaan: "persediaan-1", hpp: "hpp-1" }
    });

    expect(sumBy(details, (row) => row.debit)).toBe(sumBy(details, (row) => row.kredit));
    expect(details).toHaveLength(2);
  });

  it("routes cash sales to Kas and everything else to Bank", () => {
    expect(resolveKasAkunKode("tunai").nama).toBe("Kas");
    expect(resolveKasAkunKode("transfer").nama).toBe("Bank");
    expect(resolveKasAkunKode("BPJS").nama).toBe("Bank");
  });

  it("lists customer sales for sales returns and rejects over-returned quantities", async () => {
    const sales = await returPenjualanService.salesByPelanggan("p-2");

    expect(sales[0].nomorInvoice).toBe("PJL-20260707-0001");
    expect(sales[0].details[0]).toMatchObject({
      namaBarang: "Paracetamol 500mg",
      sisaRetur: 12
    });

    await expect(
      returPenjualanService.create({
        pelangganId: "p-2",
        penjualanId: "pj-1",
        tanggal: "2026-07-08",
        alasan: "Tes retur berlebih",
        items: [
          {
            penjualanDetailId: "pjd-1",
            penjualanId: "pj-1",
            barangId: "o-1",
            jumlah: 99,
            hargaJual: 650
          }
        ]
      })
    ).rejects.toThrow("melebihi sisa");
  });

  it("converts eceran return qty back to stock qty", () => {
    expect(resolveReturStockQty(5, 5)).toBe(1);
    expect(resolveReturStockQty(2, 5)).toBe(0.4);
    expect(resolveReturStockQty(3)).toBe(3);
  });

  it("moves fully returned sales out of returable sales and into return reports", async () => {
    const created = await returPenjualanService.create({
      pelangganId: "p-2",
      penjualanId: "pj-1",
      tanggal: "2026-07-08",
      alasan: "Retur penuh",
      items: [
        {
          penjualanDetailId: "pjd-1",
          penjualanId: "pj-1",
          barangId: "o-1",
          jumlah: 12,
          hargaJual: 650
        },
        {
          penjualanDetailId: "pjd-2",
          penjualanId: "pj-1",
          barangId: "o-4",
          jumlah: 12,
          hargaJual: 950
        }
      ]
    });

    const sales = await returPenjualanService.salesByPelanggan("p-2");
    const reports = await returPenjualanService.list({ perPage: 10 });

    expect(sales).toHaveLength(0);
    expect(reports.data[0]).toMatchObject({
      namaPelanggan: "Budi Santoso",
      nomorInvoice: "PJL-20260707-0001",
      total: 19200
    });

    vi.resetModules();
    const { returPenjualanService: reloadedReturPenjualanService } =
      await import("./returPenjualanService");
    const reloadedSales =
      await reloadedReturPenjualanService.salesByPelanggan("p-2");
    const reloadedReports = await reloadedReturPenjualanService.list({
      perPage: 10
    });

    expect(reloadedSales).toHaveLength(0);
    expect(reloadedReports.data[0]?.id).toBe(created.id);
  });

  it("books a balanced jurnal for a purchase receipt (inventory in, payable out)", () => {
    const details = buildPembelianJurnalDetails({
      grandTotal: 255300,
      nomorInternal: "PBL-TEST-0001",
      namaSupplier: "PT Sehat Farma",
      akunIds: { persediaan: "persediaan-1", utang: "utang-1" }
    });

    expect(sumBy(details, (row) => row.debit)).toBe(sumBy(details, (row) => row.kredit));
    expect(sumBy(details, (row) => row.debit)).toBe(255300);
  });
});
