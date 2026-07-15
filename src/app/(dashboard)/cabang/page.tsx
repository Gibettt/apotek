"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function CabangPage() {
  return <ModuleListPage config={moduleConfigs.cabang} />;
}
