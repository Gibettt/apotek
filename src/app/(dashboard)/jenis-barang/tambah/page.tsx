"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahJenisBarangPage() {
  return <ModuleFormPage config={moduleConfigs.jenisBarang} mode="create" />;
}
