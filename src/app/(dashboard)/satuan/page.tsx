"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function SatuanPage() {
  return <ModuleListPage config={moduleConfigs.satuan} />;
}
