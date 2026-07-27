import { ReportPage } from "@/components/pages/ReportPage";
import { laporanService } from "@/services/laporanService";

export default async function LaporanPembelianPage() {
  const rows = await laporanService.pembelianReport();

  return (
    <ReportPage
      title="Laporan Pembelian"
      description="Rekap pembelian supplier, status PO, dan nilai penerimaan barang."
      rows={rows}
    />
  );
}
