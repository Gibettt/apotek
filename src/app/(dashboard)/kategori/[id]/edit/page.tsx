import { KategoriForm } from "@/components/forms/KategoriForm";
import { moduleConfigs } from "@/constants/modules";

export default function EditKategoriPage({ params }: { params: { id: string } }) {
  const record = moduleConfigs.kategori.rows.find(
    (item) => String(item.id) === params.id
  );

  return <KategoriForm record={record} />;
}
