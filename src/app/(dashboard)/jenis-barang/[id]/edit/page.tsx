import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditJenisBarangPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.jenisBarang.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.jenisBarang} record={record} mode="edit" />;
}
