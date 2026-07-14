import { ObatForm } from "@/components/forms/ObatForm";
import { obatService } from "@/services/obatService";

export default async function EditObatPage({
  params
}: {
  params: { id: string };
}) {
  const record = await obatService.getById(Number(params.id)).catch(() => null);

  return <ObatForm record={record} />;
}
