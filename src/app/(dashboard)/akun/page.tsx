"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function AkunPage() {
  return <ModuleListPage config={moduleConfigs.akun} />;
}
