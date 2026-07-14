"use client";

import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs, type ModuleRecord } from "@/constants/modules";

export function UserForm({ record }: { record?: ModuleRecord }) {
  return (
    <ModuleFormPage
      config={moduleConfigs.users}
      record={record}
      mode={record ? "edit" : "create"}
    />
  );
}
