"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahGolonganPage() {
  return <ModuleFormPage config={moduleConfigs.golongan} mode="create" />;
}
