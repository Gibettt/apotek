import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";

export default async function EditLokasiSimpanPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.lokasiSimpan.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <ModuleFormPage config={moduleConfigs.lokasiSimpan} record={record} mode="edit" />;
}
