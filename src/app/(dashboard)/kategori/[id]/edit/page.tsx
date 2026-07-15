import { KategoriForm } from "@/components/forms/KategoriForm";
import { moduleConfigs } from "@/constants/modules";

export default async function EditKategoriPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.kategori.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <KategoriForm record={record} />;
}
