import { PenjualanDetailPage } from "@/components/pages/PenjualanDetailPage";

export default function DetailPenjualanRoute({
  params
}: {
  params: { id: string };
}) {
  return <PenjualanDetailPage id={params.id} />;
}
