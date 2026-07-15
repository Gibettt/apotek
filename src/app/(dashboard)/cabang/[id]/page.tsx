import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailCabangPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.cabang.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.cabang} record={record} />;
}
