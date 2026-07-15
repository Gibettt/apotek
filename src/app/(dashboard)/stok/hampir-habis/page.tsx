"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs, type ModuleConfig } from "@/constants/modules";

const config: ModuleConfig = {
  ...moduleConfigs.obat,
  key: "stok-hampir-habis",
  title: "Obat Hampir Habis",
  description: "Daftar obat dengan stok tersedia di bawah stok minimum.",
  basePath: "/obat",
  addPath: undefined,
  load: async () => {
    const rows = await moduleConfigs.obat.load();
    return rows.filter((item) => Number(item.stokTersedia) < Number(item.stokMinimum));
  }
};

export default function StokHampirHabisPage() {
  return <ModuleListPage config={config} />;
}
