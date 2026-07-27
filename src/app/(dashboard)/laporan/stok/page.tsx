import { ReportPage } from "@/components/pages/ReportPage";
import { laporanService } from "@/services/laporanService";

export default async function LaporanStokPage() {
  const rows = await laporanService.stokReport();

  return (
    <ReportPage
      title="Laporan Stok"
      description="Rekap batch, expired, lokasi, dan jumlah stok obat."
      rows={rows}
    />
  );
}
