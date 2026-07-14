"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs, type ModuleRecord } from "@/constants/modules";

export function PelangganForm({ record }: { record?: ModuleRecord }) {
  return (
    <ModuleFormPage
      config={moduleConfigs.pelanggan}
      record={record}
      mode={record ? "edit" : "create"}
    />
  );
}
