export interface DashboardSummary {
  totalPenjualanHariIni: number;
  jumlahTransaksiHariIni: number;
  stokMenipis: number;
  obatExpired: number;
  pembelianTerbaru: number;
}

export interface ChartPoint {
  label: string;
  penjualan: number;
  pembelian?: number;
  laba?: number;
}

export interface ReportRow {
  id: number | string;
  tanggal: string;
  referensi: string;
  kategori: string;
  nilai: number;
  status: string;
}

export interface SalesReportRow extends ReportRow {
  pelanggan: string;
  subtotal: number;
  diskon: number;
  pajak: number;
  bayar: number;
  kembalian: number;
  itemCount: number;
}

export interface SalesReportSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  totalItems: number;
  completedTransactions: number;
  canceledTransactions: number;
  cashRevenue: number;
  transferRevenue: number;
  bpjsRevenue: number;
  accurateRevenue: number;
}
