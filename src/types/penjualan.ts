export type MetodePembayaran = "tunai" | "transfer" | "BPJS" | "accurate";
export type StatusPenjualan =
  | "menunggu_pembayaran"
  | "selesai"
  | "gagal"
  | "dibatalkan";

export interface PenjualanDetail {
  id: number;
  penjualanId: number;
  obatId: number;
  namaObat: string;
  jumlah: number;
  hargaJual: number;
  diskon: number;
  subtotal: number;
}

export interface Penjualan {
  id: number;
  nomorPenjualan: string;
  pelangganId?: number;
  namaPelanggan: string;
  resepId?: number;
  tanggalPenjualan: string;
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  metodePembayaran: MetodePembayaran;
  bayar: number;
  kembalian: number;
  status: StatusPenjualan;
  catatan?: string;
  createdBy: string;
  createdAt: string;
  details: PenjualanDetail[];
}

export interface CartItem {
  obatId: number;
  kodeObat: string;
  namaObat: string;
  hargaJual: number;
  stokTersedia: number;
  membutuhkanResep: boolean;
  quantity: number;
}
