import { ReportPage } from "@/components/pages/ReportPage";
import { laporanService } from "@/services/laporanService";

export default async function LaporanLabaRugiPage() {
  const rows = await laporanService.labaRugiReport();

  return (
    <ReportPage
      title="Laporan Laba Rugi"
      description="Perhitungan laba kotor dari penjualan dikurangi HPP."
      rows={rows}
    />
  );
}
