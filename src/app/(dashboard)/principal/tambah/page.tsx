"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahPrincipalPage() {
  return <ModuleFormPage config={moduleConfigs.principal} mode="create" />;
}
