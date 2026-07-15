"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahRolePage() {
  return <ModuleFormPage config={moduleConfigs.role} mode="create" />;
}
