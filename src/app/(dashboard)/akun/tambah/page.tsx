"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahAkunPage() {
  return <ModuleFormPage config={moduleConfigs.akun} mode="create" />;
}
