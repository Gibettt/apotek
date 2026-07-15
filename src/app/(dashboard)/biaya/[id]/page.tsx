import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailBiayaPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.biaya.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.biaya} record={record} />;
}
