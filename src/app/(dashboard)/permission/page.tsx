"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function PermissionPage() {
  return <ModuleListPage config={moduleConfigs.permission} />;
}
