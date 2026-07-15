import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailGolonganPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.golongan.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.golongan} record={record} />;
}
