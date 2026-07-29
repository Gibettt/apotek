export type StatusRetur = "draft" | "posted" | "dibatalkan";

export interface ReturPembelianDetail {
  id: string;
  returId: string;
  barangId: string;
  namaBarang: string;
  batchId?: string;
  nomorBatch?: string;
  jumlah: number;
  hargaBeli: number;
  subtotal: number;
}

export interface ReturPembelian {
  id: string;
  cabangId: string;
  nomor: string;
  supplierId: string;
  namaSupplier: string;
  pembelianId?: string;
  tanggal: string;
  alasan: string;
  total: number;
  status: StatusRetur;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  details: ReturPembelianDetail[];
}

export interface ReturPenjualanDetail {
  id: string;
  returId: string;
  penjualanId: string;
  penjualanDetailId: string;
  barangId: string;
  namaBarang: string;
  satuanId?: string;
  satuanNama?: string;
  jumlah: number;
  stockQty?: number;
  hargaJual: number;
  subtotal: number;
}

export interface ReturPenjualan {
  id: string;
  cabangId: string;
  nomor: string;
  pelangganId: string;
  namaPelanggan: string;
  penjualanId: string;
  nomorInvoice: string;
  tanggal: string;
  alasan: string;
  total: number;
  status: StatusRetur;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  details: ReturPenjualanDetail[];
}
