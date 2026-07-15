"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function RolePage() {
  return <ModuleListPage config={moduleConfigs.role} />;
}
