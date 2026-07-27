import { ObatForm } from "@/components/forms/ObatForm";
import { Header } from "@/components/layout/Header";
import { obatService } from "@/services/obatService";

export default async function EditObatPage({
  params
}: {
  params: { id: string };
}) {
  const record = await obatService.getById(params.id).catch(() => null);

  if (!record) {
    return (
      <Header
        title="Barang tidak ditemukan"
        description="Data barang tidak tersedia."
      />
    );
  }

  return <ObatForm record={record} />;
}
