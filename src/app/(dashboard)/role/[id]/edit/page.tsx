import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditRolePage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.role.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.role} record={record} mode="edit" />;
}
