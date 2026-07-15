"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahDokterPage() {
  return <ModuleFormPage config={moduleConfigs.dokter} mode="create" />;
}
