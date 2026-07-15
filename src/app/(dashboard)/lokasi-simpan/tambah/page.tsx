"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahLokasiSimpanPage() {
  return <ModuleFormPage config={moduleConfigs.lokasiSimpan} mode="create" />;
}
