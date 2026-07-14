export type SettingGroup = "apotek" | "struk" | "stok" | "notifikasi";

export interface Setting {
  id: number;
  key: string;
  value: string;
  group: SettingGroup;
  label: string;
}
