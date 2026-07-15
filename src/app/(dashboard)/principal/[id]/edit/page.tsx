import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditPrincipalPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.principal.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.principal} record={record} mode="edit" />;
}
