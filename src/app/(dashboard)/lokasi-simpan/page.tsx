"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function LokasiSimpanPage() {
  return <ModuleListPage config={moduleConfigs.lokasiSimpan} />;
}
