import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailPenjualanPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.penjualan.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.penjualan} record={record} />;
}
