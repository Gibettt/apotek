"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function PrincipalPage() {
  return <ModuleListPage config={moduleConfigs.principal} />;
}
