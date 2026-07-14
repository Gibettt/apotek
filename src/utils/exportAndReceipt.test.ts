import { describe, expect, it } from "vitest";
import { penjualan, reportRows } from "@/lib/mock-data";
import { buildCsv } from "./exportExcel";
import { buildPrintableReport } from "./exportPdf";
import { buildReceiptText } from "./printReceipt";

describe("export and receipt helpers", () => {
  it("builds csv with a stable header", () => {
    const csv = buildCsv(reportRows.penjualan);

    expect(csv.split("\n")[0]).toBe('"Tanggal","Referensi","Kategori","Nilai","Status"');
    expect(csv).toContain("PJL-20260707-0001");
  });

  it("summarizes printable reports", () => {
    const report = buildPrintableReport("Laporan Penjualan", reportRows.penjualan);

    expect(report.total).toBe(19200);
    expect(report.summary).toContain("Laporan Penjualan");
  });

  it("includes payment totals in receipt text", () => {
    const receipt = buildReceiptText(penjualan[0]);

    expect(receipt).toContain("PJL-20260707-0001");
    expect(receipt).toContain("Kembali");
  });
});
