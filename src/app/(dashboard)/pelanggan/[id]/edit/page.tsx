import { PelangganForm } from "@/components/forms/PelangganForm";
import { moduleConfigs } from "@/constants/modules";

export default function EditPelangganPage({ params }: { params: { id: string } }) {
  const record = moduleConfigs.pelanggan.rows.find(
    (item) => String(item.id) === params.id
  );

  return <PelangganForm record={record} />;
}
