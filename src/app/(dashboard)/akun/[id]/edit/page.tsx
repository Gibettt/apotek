import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditAkunPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.akun.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.akun} record={record} mode="edit" />;
}
