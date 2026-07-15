"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahCabangPage() {
  return <ModuleFormPage config={moduleConfigs.cabang} mode="create" />;
}
