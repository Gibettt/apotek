"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function StokMasukPage() {
  return (
    <ModuleFormPage
      config={moduleConfigs.stok}
      title="Stok Masuk"
    />
  );
}
