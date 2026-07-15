export type TipeMutasi =
  | "masuk"
  | "keluar"
  | "opname"
  | "penyesuaian"
  | "transfer_masuk"
  | "transfer_keluar";

export interface StokBatch {
  id: string;
  barangId: string;
  namaBarang: string;
  nomorBatch: string;
  tanggalExpired?: string;
  qty: number;
  cabangId: string;
  lokasiSimpanId?: string;
  lokasiNama?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StokMutasi {
  id: string;
  cabangId: string;
  barangId: string;
  namaBarang: string;
  batchId?: string;
  tipeMutasi: TipeMutasi;
  qtyMasuk: number;
  qtyKeluar: number;
  saldoAkhir: number;
  hargaPokok: number;
  sumberTabel?: string;
  sumberId?: string;
  keterangan?: string;
  createdBy?: string;
  createdAt: string;
}
