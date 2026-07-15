"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function JenisBarangPage() {
  return <ModuleListPage config={moduleConfigs.jenisBarang} />;
}
