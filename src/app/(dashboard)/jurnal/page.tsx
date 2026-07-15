"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function JurnalPage() {
  return <ModuleListPage config={moduleConfigs.jurnal} />;
}
