import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditCabangPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.cabang.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.cabang} record={record} mode="edit" />;
}
