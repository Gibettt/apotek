"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs, type ModuleConfig } from "@/constants/modules";
import { isLowStock } from "@/lib/stockRules";

const config: ModuleConfig = {
  ...moduleConfigs.obat,
  key: "stok-hampir-habis",
  title: "Obat Hampir Habis",
  description: "Daftar obat dengan stok tersedia 30 atau di bawahnya.",
  basePath: "/obat",
  addPath: undefined,
  load: async () => {
    const rows = await moduleConfigs.obat.load();
    return rows.filter((item) => isLowStock(Number(item.stokTersedia)));
  }
};

export default function StokHampirHabisPage() {
  return <ModuleListPage config={config} />;
}
