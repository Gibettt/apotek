"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahSatuanPage() {
  return <ModuleFormPage config={moduleConfigs.satuan} mode="create" />;
}
