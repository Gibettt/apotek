import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailSatuanPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.satuan.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.satuan} record={record} />;
}
