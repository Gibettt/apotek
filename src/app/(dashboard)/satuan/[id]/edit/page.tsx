import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditSatuanPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.satuan.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.satuan} record={record} mode="edit" />;
}
