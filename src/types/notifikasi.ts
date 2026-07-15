import type { RoleName } from "./auth";

export type TipeNotifikasi = "stok_menipis" | "obat_expired" | "sistem";

export interface Notifikasi {
  id: string;
  cabangId?: string;
  penggunaId?: string;
  tipe: TipeNotifikasi;
  judul: string;
  pesan?: string;
  referensiTabel?: string;
  referensiId?: string;
  isRead: boolean;
  targetRole?: RoleName;
  createdAt: string;
}
