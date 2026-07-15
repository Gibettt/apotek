import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailJenisBarangPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.jenisBarang.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.jenisBarang} record={record} />;
}
