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
