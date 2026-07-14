import type { RoleName } from "./auth";

export type TipeNotifikasi = "stok_menipis" | "obat_expired" | "sistem";

export interface Notifikasi {
  id: number;
  tipe: TipeNotifikasi;
  judul: string;
  pesan: string;
  referensiId?: number;
  isRead: boolean;
  targetRole: RoleName;
  createdAt: string;
}
