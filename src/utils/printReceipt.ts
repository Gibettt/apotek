import type { Penjualan } from "@/types";
import { formatCurrency } from "./formatCurrency";
import { formatDateTime } from "./formatDate";

export function buildReceiptText(penjualan: Penjualan) {
  const lines = [
    "APOTEK ANANDA",
    "Jl. Kesehatan No. 12",
    `No: ${penjualan.nomorPenjualan}`,
    `Tanggal: ${formatDateTime(penjualan.tanggalPenjualan)}`,
    "--------------------------------",
    ...penjualan.details.map(
      (item) =>
        `${item.namaObat} x${item.jumlah} ${formatCurrency(item.subtotal)}`
    ),
    "--------------------------------",
    `Total: ${formatCurrency(penjualan.total)}`,
    `Bayar: ${formatCurrency(penjualan.bayar)}`,
    `Kembali: ${formatCurrency(penjualan.kembalian)}`,
    "Terima kasih"
  ];

  return lines.join("\n");
}
