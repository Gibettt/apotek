"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahPermissionPage() {
  return <ModuleFormPage config={moduleConfigs.permission} mode="create" />;
}
