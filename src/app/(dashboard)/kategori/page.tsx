import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function KategoriPage() {
  return <ModuleListPage config={moduleConfigs.kategori} />;
}
