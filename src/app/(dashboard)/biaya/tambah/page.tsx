"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahBiayaPage() {
  return <ModuleFormPage config={moduleConfigs.biaya} mode="create" />;
}
