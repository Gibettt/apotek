import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditDokterPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.dokter.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.dokter} record={record} mode="edit" />;
}
