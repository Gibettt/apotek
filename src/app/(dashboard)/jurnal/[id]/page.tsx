import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailJurnalPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.jurnal.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.jurnal} record={record} />;
}
