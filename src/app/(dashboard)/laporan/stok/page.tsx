import { ReportPage } from "@/components/pages/ReportPage";
import { reportRows } from "@/lib/mock-data";

export default function LaporanStokPage() {
  return (
    <ReportPage
      title="Laporan Stok"
      description="Rekap batch, expired, lokasi, dan jumlah stok obat."
      rows={reportRows.stok}
    />
  );
}
