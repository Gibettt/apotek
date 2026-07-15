import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditPabrikPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.pabrik.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.pabrik} record={record} mode="edit" />;
}
