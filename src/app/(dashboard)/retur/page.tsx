"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function ReturPage() {
  return <ModuleListPage config={moduleConfigs.retur} />;
}
