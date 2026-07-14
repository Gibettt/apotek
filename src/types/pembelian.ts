export type StatusPembelian = "draft" | "diterima" | "dibatalkan";

export interface PembelianDetail {
  id: number;
  pembelianId: number;
  obatId: number;
  namaObat: string;
  batchNumber: string;
  tanggalExpired: string;
  jumlah: number;
  hargaBeli: number;
  diskon: number;
  subtotal: number;
}

export interface Pembelian {
  id: number;
  nomorPembelian: string;
  supplierId: number;
  namaSupplier: string;
  tanggalPembelian: string;
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  status: StatusPembelian;
  catatan?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  details: PembelianDetail[];
}
