import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function PelangganPage() {
  return <ModuleListPage config={moduleConfigs.pelanggan} />;
}
