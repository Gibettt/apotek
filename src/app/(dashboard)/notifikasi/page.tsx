import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function NotifikasiPage() {
  return <ModuleListPage config={moduleConfigs.notifikasi} />;
}
