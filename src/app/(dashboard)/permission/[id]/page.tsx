import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";

export default async function DetailPermissionPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.permission.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleDetailPage config={moduleConfigs.permission} record={record} />;
}
