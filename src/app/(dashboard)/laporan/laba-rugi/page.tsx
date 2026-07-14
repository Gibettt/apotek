import { ReportPage } from "@/components/pages/ReportPage";
import { reportRows } from "@/lib/mock-data";

export default function LaporanLabaRugiPage() {
  return (
    <ReportPage
      title="Laporan Laba Rugi"
      description="Perhitungan laba kotor dari penjualan dikurangi HPP."
      rows={reportRows["laba-rugi"]}
    />
  );
}
