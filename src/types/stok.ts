export type TipeMutasi = "masuk" | "keluar" | "opname" | "penyesuaian";

export interface StokBatch {
  id: number;
  obatId: number;
  namaObat: string;
  batchNumber: string;
  tanggalExpired: string;
  jumlah: number;
  lokasi: string;
  createdAt: string;
  updatedAt: string;
}

export interface StokMutasi {
  id: number;
  obatId: number;
  namaObat: string;
  tipeMutasi: TipeMutasi;
  jumlah: number;
  sumber: "pembelian" | "penjualan" | "manual";
  referensiId?: number;
  stokSebelum: number;
  stokSesudah: number;
  keterangan: string;
  createdBy: string;
  createdAt: string;
}
