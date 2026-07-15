import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailAkunPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.akun.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.akun} record={record} />;
}
