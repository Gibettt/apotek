import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailSuratPesananPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.suratPesanan.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.suratPesanan} record={record} />;
}
