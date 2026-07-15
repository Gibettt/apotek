import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailLokasiSimpanPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.lokasiSimpan.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.lokasiSimpan} record={record} />;
}
