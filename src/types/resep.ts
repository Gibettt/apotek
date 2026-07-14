export type StatusResep = "menunggu" | "diproses" | "selesai" | "ditolak";

export interface ResepDetail {
  id: number;
  resepId: number;
  obatId: number;
  namaObat: string;
  aturanPakai: string;
  jumlah: number;
  catatan?: string;
}

export interface Resep {
  id: number;
  nomorResep: string;
  pelangganId: number;
  namaPelanggan: string;
  penjualanId?: number;
  namaDokter: string;
  noSipDokter: string;
  asalPuskesmas?: string;
  tanggalResep: string;
  catatan?: string;
  status: StatusResep;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  details: ResepDetail[];
}
