"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function AuditLogPage() {
  return <ModuleListPage config={moduleConfigs.auditLog} />;
}
