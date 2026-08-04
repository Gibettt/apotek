import type { Penjualan } from "@/types";
import { formatCurrency } from "./formatCurrency";
import { formatDateTime } from "./formatDate";

export function buildReceiptText(penjualan: Penjualan) {
  const lines = [
    "APOTEK ANANDA",
    "Jl. Kesehatan No. 12",
    "STRUK PENJUALAN",
    `No: ${penjualan.nomorInvoice}`,
    `Tanggal: ${formatDateTime(penjualan.tanggal)}`,
    `Pelanggan: ${penjualan.namaPelanggan || "Umum"}`,
    `Metode: ${penjualan.metodePembayaran ?? "tunai"}`,
    "--------------------------------",
    ...penjualan.details.map(
      (item) =>
        `${item.namaBarang} x${item.jumlah} ${formatCurrency(item.subtotal)}`
    ),
    "--------------------------------",
    `Total: ${formatCurrency(penjualan.grandTotal)}`,
    `Bayar: ${formatCurrency(penjualan.bayarTotal)}`,
    `Kembali: ${formatCurrency(penjualan.kembalian)}`,
    "Terima kasih"
  ];

  return lines.join("\n");
}

export function printReceipt(penjualan: Penjualan) {
  const receipt = buildReceiptText(penjualan);
  const frame = document.createElement("iframe");

  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    window.print();
    return;
  }

  doc.open();
  doc.write(`<!doctype html>
<html>
  <head>
    <title>Struk ${penjualan.nomorInvoice}</title>
    <style>
      @page { margin: 8mm; }
      body { width: 80mm; margin: 0; background: #fff; color: #000; }
      pre {
        margin: 0;
        white-space: pre-wrap;
        font: 12px/1.55 Consolas, "Courier New", monospace;
      }
    </style>
  </head>
  <body><pre>${receipt.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char] ?? char)}</pre></body>
</html>`);
  doc.close();

  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  window.setTimeout(() => frame.remove(), 1000);
}
