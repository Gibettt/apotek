export type StatusPembelian = "draft" | "diterima" | "dibatalkan";

export interface PembelianDetail {
  id: string;
  pembelianId: string;
  barangId: string;
  namaBarang: string;
  batchId?: string;
  batchNumber?: string;
  tanggalExpired?: string;
  satuanId?: string;
  jumlah: number;
  hargaBeli: number;
  diskonPersen: number;
  diskonNominal: number;
  subtotal: number;
  hargaPokok: number;
}

export interface Pembelian {
  id: string;
  cabangId: string;
  nomorFaktur: string;
  nomorInternal: string;
  supplierId: string;
  namaSupplier: string;
  suratPesananId?: string;
  tanggalFaktur: string;
  tanggalJatuhTempo?: string;
  subtotal: number;
  diskonTotal: number;
  pajakTotal: number;
  grandTotal: number;
  status: StatusPembelian;
  catatan?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  details: PembelianDetail[];
}
