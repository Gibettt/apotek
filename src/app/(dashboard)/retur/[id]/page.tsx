import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailReturPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.retur.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.retur} record={record} />;
}
