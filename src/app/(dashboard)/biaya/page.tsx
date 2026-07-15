"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function BiayaPage() {
  return <ModuleListPage config={moduleConfigs.biaya} />;
}
