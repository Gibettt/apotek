import type { Penjualan } from "@/types";
import { formatCurrency } from "./formatCurrency";
import { formatDateTime } from "./formatDate";

export function buildReceiptText(penjualan: Penjualan) {
  const lines = [
    "APOTEK ANANDA",
    "Jl. Kesehatan No. 12",
    `No: ${penjualan.nomorInvoice}`,
    `Tanggal: ${formatDateTime(penjualan.tanggal)}`,
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
