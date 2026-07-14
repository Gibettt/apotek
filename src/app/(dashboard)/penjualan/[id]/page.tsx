import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default function DetailPenjualanPage({ params }: { params: { id: string } }) {
  const record = moduleConfigs.penjualan.rows.find(
    (item) => String(item.id) === params.id
  );

  return <ModuleDetailPage config={moduleConfigs.penjualan} record={record} />;
}
