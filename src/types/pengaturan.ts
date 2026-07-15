export type PengaturanGroup = "apotek" | "struk" | "stok" | "notifikasi";

export interface Pengaturan {
  id: string;
  cabangId?: string;
  key: string;
  value: string;
  group: PengaturanGroup;
  label: string;
}
