export type MetodePembayaran = "tunai" | "transfer" | "accurate";
export type StatusPenjualan =
  | "menunggu_pembayaran"
  | "selesai"
  | "gagal"
  | "dibatalkan";
export type StatusBayar = "belum_bayar" | "lunas" | "sebagian";

export interface PenjualanDetail {
  id: string;
  penjualanId: string;
  barangId: string;
  namaBarang: string;
  batchId?: string;
  satuanId?: string;
  satuanNama?: string;
  jumlah: number;
  hargaJual: number;
  diskonPersen: number;
  diskonNominal: number;
  subtotal: number;
  hargaPokok: number;
}

export interface Penjualan {
  id: string;
  cabangId: string;
  shiftKasirId?: string;
  nomorInvoice: string;
  pelangganId?: string;
  namaPelanggan: string;
  resepId?: string;
  tanggal: string;
  tipePenjualan: string;
  subtotal: number;
  diskonTotal: number;
  pajakTotal: number;
  grandTotal: number;
  bayarTotal: number;
  kembalian: number;
  statusBayar: StatusBayar;
  status: StatusPenjualan;
  metodePembayaran?: MetodePembayaran;
  catatan?: string;
  createdBy?: string;
  createdAt: string;
  details: PenjualanDetail[];
}

export interface CartItem {
  cartKey?: string;
  barangId: string;
  kode: string;
  nama: string;
  satuanId?: string;
  satuanNama?: string;
  tipeHarga?: "jual" | "eceran";
  stockQtyPerUnit?: number;
  hargaJual: number;
  stokTersedia: number;
  membutuhkanResep: boolean;
  quantity: number;
}
