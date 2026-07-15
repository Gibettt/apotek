export type StatusResep = "menunggu" | "diproses" | "selesai" | "ditolak";

export interface ResepDetail {
  id: string;
  resepId: string;
  barangId?: string;
  namaBarang?: string;
  satuanId?: string;
  jumlah: number;
  aturanPakai?: string;
  instruksiRacikan?: string;
  racikan: boolean;
  catatan?: string;
}

export interface Resep {
  id: string;
  nomorResep?: string;
  pelangganId?: string;
  namaPelanggan: string;
  penjualanId?: string;
  dokterId?: string;
  namaDokter: string;
  noSipDokter?: string;
  asalPuskesmas?: string;
  tanggalResep: string;
  namaPasien?: string;
  umurPasien?: string;
  alamatPasien?: string;
  catatan?: string;
  status: StatusResep;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  details: ResepDetail[];
}
