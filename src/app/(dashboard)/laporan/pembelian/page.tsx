import { ReportPage } from "@/components/pages/ReportPage";
import { reportRows } from "@/lib/mock-data";

export default function LaporanPembelianPage() {
  return (
    <ReportPage
      title="Laporan Pembelian"
      description="Rekap pembelian supplier, status PO, dan nilai penerimaan barang."
      rows={reportRows.pembelian}
    />
  );
}
