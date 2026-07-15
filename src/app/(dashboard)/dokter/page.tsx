"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function DokterPage() {
  return <ModuleListPage config={moduleConfigs.dokter} />;
}
