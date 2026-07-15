"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function PabrikPage() {
  return <ModuleListPage config={moduleConfigs.pabrik} />;
}
