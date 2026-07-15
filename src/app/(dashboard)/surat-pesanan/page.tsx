"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function SuratPesananPage() {
  return <ModuleListPage config={moduleConfigs.suratPesanan} />;
}
