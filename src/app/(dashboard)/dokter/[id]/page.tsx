import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailDokterPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.dokter.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.dokter} record={record} />;
}
