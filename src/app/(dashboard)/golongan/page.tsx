"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function GolonganPage() {
  return <ModuleListPage config={moduleConfigs.golongan} />;
}
