import { PelangganForm } from "@/components/forms/PelangganForm";
import { moduleConfigs } from "@/constants/modules";

export default async function EditPelangganPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.pelanggan.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <PelangganForm record={record} />;
}
