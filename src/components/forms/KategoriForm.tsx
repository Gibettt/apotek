"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs, type ModuleRecord } from "@/constants/modules";

export function KategoriForm({ record }: { record?: ModuleRecord }) {
  return (
    <ModuleFormPage
      config={moduleConfigs.kategori}
      record={record}
      mode={record ? "edit" : "create"}
    />
  );
}
