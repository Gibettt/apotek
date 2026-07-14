import { dashboardSummary, penjualan, reportRows, salesChart } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  MetodePembayaran,
  ReportRow,
  SalesReportRow,
  SalesReportSummary,
  StatusPenjualan
} from "@/types";
import { delay, matchSearch } from "./serviceUtils";

interface PenjualanRow {
  id: number;
  nomor_penjualan: string;
  pelanggan_id: number | null;
  resep_id: number | null;
  tanggal_penjualan: string | null;
  subtotal: number | string | null;
  diskon: number | string | null;
  pajak: number | string | null;
  total: number | string | null;
  metode_pembayaran: MetodePembayaran | null;
  bayar: number | string | null;
  kembalian: number | string | null;
  status: StatusPenjualan | null;
  catatan: string | null;
  created_by: string | null;
  created_at: string | null;
}

interface PenjualanDetailRow {
  penjualan_id: number | null;
  jumlah: number | null;
}

export interface SalesReportParams {
  startDate?: string;
  endDate?: string;
  metodePembayaran?: MetodePembayaran | "semua";
  status?: StatusPenjualan | "semua";
  search?: string;
}

function startOfDay(date?: string) {
  return date ? `${date}T00:00:00` : undefined;
}

function endOfDay(date?: string) {
  return date ? `${date}T23:59:59` : undefined;
}

function inDateRange(value: string, startDate?: string, endDate?: string) {
  const time = new Date(value).getTime();

  if (startDate && time < new Date(startOfDay(startDate) as string).getTime()) {
    return false;
  }

  if (endDate && time > new Date(endOfDay(endDate) as string).getTime()) {
    return false;
  }

  return true;
}

function summarizeSales(rows: SalesReportRow[]): SalesReportSummary {
  const completedRows = rows.filter((row) => row.status === "selesai");
  const totalRevenue = completedRows.reduce((sum, row) => sum + row.nilai, 0);
  const totalTransactions = rows.length;

  return {
    totalRevenue,
    totalTransactions,
    averageTransaction: completedRows.length
      ? totalRevenue / completedRows.length
      : 0,
    totalItems: completedRows.reduce((sum, row) => sum + row.itemCount, 0),
    completedTransactions: completedRows.length,
    canceledTransactions: rows.filter((row) => row.status === "dibatalkan").length,
    cashRevenue: completedRows
      .filter((row) => row.kategori === "tunai")
      .reduce((sum, row) => sum + row.nilai, 0),
    transferRevenue: completedRows
      .filter((row) => row.kategori === "transfer")
      .reduce((sum, row) => sum + row.nilai, 0),
    bpjsRevenue: completedRows
      .filter((row) => row.kategori === "BPJS")
      .reduce((sum, row) => sum + row.nilai, 0),
    accurateRevenue: completedRows
      .filter((row) => row.kategori === "accurate")
      .reduce((sum, row) => sum + row.nilai, 0)
  };
}

function filterSalesRows(rows: SalesReportRow[], params: SalesReportParams) {
  const filtered = rows.filter((row) => {
    if (!inDateRange(row.tanggal, params.startDate, params.endDate)) {
      return false;
    }

    if (
      params.metodePembayaran &&
      params.metodePembayaran !== "semua" &&
      row.kategori !== params.metodePembayaran
    ) {
      return false;
    }

    if (
      params.status &&
      params.status !== "semua" &&
      row.status !== params.status
    ) {
      return false;
    }

    return true;
  });

  return matchSearch(filtered, params.search, [
    "referensi",
    "pelanggan",
    "kategori",
    "status"
  ]);
}

function localSalesRows() {
  return penjualan.map<SalesReportRow>((item) => ({
    id: item.id,
    tanggal: item.tanggalPenjualan,
    referensi: item.nomorPenjualan,
    kategori: item.metodePembayaran,
    nilai: item.total,
    status: item.status,
    pelanggan: item.namaPelanggan,
    subtotal: item.subtotal,
    diskon: item.diskon,
    pajak: item.pajak,
    bayar: item.bayar,
    kembalian: item.kembalian,
    itemCount: item.details.reduce((sum, detail) => sum + detail.jumlah, 0)
  }));
}

async function supabaseSalesRows(params: SalesReportParams) {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("penjualan")
    .select("*")
    .order("tanggal_penjualan", { ascending: false });

  if (params.startDate) {
    query = query.gte("tanggal_penjualan", startOfDay(params.startDate) as string);
  }

  if (params.endDate) {
    query = query.lte("tanggal_penjualan", endOfDay(params.endDate) as string);
  }

  if (params.metodePembayaran && params.metodePembayaran !== "semua") {
    query = query.eq("metode_pembayaran", params.metodePembayaran);
  }

  if (params.status && params.status !== "semua") {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PenjualanRow[];
  const ids = rows.map((row) => row.id);
  const pelangganIds = rows
    .map((row) => row.pelanggan_id)
    .filter((id): id is number => Boolean(id));

  const [detailResult, pelangganResult] = await Promise.all([
    ids.length
      ? supabase
          .from("penjualan_detail")
          .select("penjualan_id,jumlah")
          .in("penjualan_id", ids)
      : Promise.resolve({ data: [], error: null }),
    pelangganIds.length
      ? supabase.from("pelanggan").select("id,nama").in("id", pelangganIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (detailResult.error) {
    throw new Error(detailResult.error.message);
  }

  if (pelangganResult.error) {
    throw new Error(pelangganResult.error.message);
  }

  const itemCountBySale = ((detailResult.data ?? []) as PenjualanDetailRow[])
    .reduce<Record<number, number>>((acc, detail) => {
      if (!detail.penjualan_id) {
        return acc;
      }

      acc[detail.penjualan_id] =
        (acc[detail.penjualan_id] ?? 0) + Number(detail.jumlah ?? 0);
      return acc;
    }, {});

  const pelangganById = Object.fromEntries(
    (pelangganResult.data ?? []).map((item) => [item.id, item.nama])
  );

  const mappedRows = rows.map<SalesReportRow>((row) => {
    const pelangganId = row.pelanggan_id ?? 0;

    return {
      id: row.id,
      tanggal: row.tanggal_penjualan ?? row.created_at ?? "",
      referensi: row.nomor_penjualan,
      kategori: row.metode_pembayaran ?? "tunai",
      nilai: Number(row.total ?? 0),
      status: row.status ?? "selesai",
      pelanggan: pelangganById[pelangganId] ?? "Umum",
      subtotal: Number(row.subtotal ?? 0),
      diskon: Number(row.diskon ?? 0),
      pajak: Number(row.pajak ?? 0),
      bayar: Number(row.bayar ?? 0),
      kembalian: Number(row.kembalian ?? 0),
      itemCount: itemCountBySale[row.id] ?? 0
    };
  });

  return matchSearch(mappedRows, params.search, [
    "referensi",
    "pelanggan",
    "kategori",
    "status"
  ]);
}

export const laporanService = {
  async dashboard() {
    return delay(dashboardSummary);
  },

  async chart() {
    return delay(salesChart);
  },

  async report(type: keyof typeof reportRows): Promise<ReportRow[]> {
    return delay(reportRows[type] ?? []);
  },

  async salesReport(params: SalesReportParams = {}) {
    const rows = isSupabaseConfigured
      ? await supabaseSalesRows(params)
      : filterSalesRows(localSalesRows(), params);

    return {
      rows,
      summary: summarizeSales(rows)
    };
  }
};
