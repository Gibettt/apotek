import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default function DetailPelangganPage({ params }: { params: { id: string } }) {
  const record = moduleConfigs.pelanggan.rows.find(
    (item) => String(item.id) === params.id
  );

  return <ModuleDetailPage config={moduleConfigs.pelanggan} record={record} />;
}
