import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailPabrikPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.pabrik.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.pabrik} record={record} />;
}
