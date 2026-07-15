"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function StokPage() {
  return <ModuleListPage config={moduleConfigs.stok} />;
}
