import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditPermissionPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.permission.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.permission} record={record} mode="edit" />;
}
