"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default function TambahPabrikPage() {
  return <ModuleFormPage config={moduleConfigs.pabrik} mode="create" />;
}
