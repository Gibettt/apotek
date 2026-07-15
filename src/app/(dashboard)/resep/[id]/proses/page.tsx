import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { ResepProcessPage } from "@/components/pages/ResepProcessPage";
import { resepService } from "@/services/resepService";

export default async function ProsesResepPage({
  params
}: {
  params: { id: string };
}) {
  const resep = await resepService.getById(params.id).catch(() => null);

  if (!resep) {
    return (
      <>
        <Header
          title="Resep tidak ditemukan"
          description="Data resep tidak tersedia di Supabase."
        />
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">
              Data yang diminta tidak tersedia.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return <ResepProcessPage resep={resep} />;
}
