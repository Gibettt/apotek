import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditGolonganPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.golongan.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.golongan} record={record} mode="edit" />;
}
