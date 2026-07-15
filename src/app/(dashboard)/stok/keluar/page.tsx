"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function StokKeluarPage() {
  return (
    <ModuleFormPage
      config={moduleConfigs.stok}
      title="Stok Keluar"
    />
  );
}
