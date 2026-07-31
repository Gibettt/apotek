import { penjualan } from "@/lib/mock-data";
import { pembelianService } from "./pembelianService";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  MetodePembayaran,
  ReportRow,
  SalesReportRow,
  SalesReportSummary,
  StatusPenjualan
} from "@/types";
import { matchSearch } from "./serviceUtils";

interface PenjualanRow {
  id: string;
  pelanggan_id: string | null;
  nomor_invoice: string;
  tanggal: string | null;
  subtotal: number | string | null;
  diskon_total: number | string | null;
  pajak_total: number | string | null;
  grand_total: number | string | null;
  bayar_total: number | string | null;
  kembalian: number | string | null;
  status: StatusPenjualan | null;
  created_at: string | null;
}

interface PenjualanDetailRow {
  penjualan_id: string | null;
  qty: number | null;
  harga_pokok?: number | string | null;
}

interface PembayaranRow {
  penjualan_id: string | null;
  metode: string | null;
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
    tanggal: item.tanggal,
    referensi: item.nomorInvoice,
    kategori: item.metodePembayaran ?? "tunai",
    nilai: item.grandTotal,
    status: item.status,
    pelanggan: item.namaPelanggan,
    subtotal: item.subtotal,
    diskon: item.diskonTotal,
    pajak: item.pajakTotal,
    bayar: item.bayarTotal,
    kembalian: item.kembalian,
    itemCount: item.details.reduce((sum, detail) => sum + detail.jumlah, 0)
  }));
}

async function supabaseSalesRows(params: SalesReportParams) {
  if (!supabase) {
    return [];
  }

  let query = supabase.from("penjualan").select("*").order("tanggal", { ascending: false });

  if (params.startDate) {
    query = query.gte("tanggal", startOfDay(params.startDate) as string);
  }

  if (params.endDate) {
    query = query.lte("tanggal", endOfDay(params.endDate) as string);
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
    .filter((id): id is string => Boolean(id));

  const [detailResult, pelangganResult, pembayaranResult] = await Promise.all([
    ids.length
      ? supabase.from("penjualan_detail").select("penjualan_id,qty").in("penjualan_id", ids)
      : Promise.resolve({ data: [], error: null }),
    pelangganIds.length
      ? supabase.from("pelanggan").select("id,nama").in("id", pelangganIds)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? supabase.from("pembayaran").select("penjualan_id,metode").in("penjualan_id", ids)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (detailResult.error) {
    throw new Error(detailResult.error.message);
  }

  if (pelangganResult.error) {
    throw new Error(pelangganResult.error.message);
  }

  if (pembayaranResult.error) {
    throw new Error(pembayaranResult.error.message);
  }

  const itemCountBySale = ((detailResult.data ?? []) as PenjualanDetailRow[]).reduce<
    Record<string, number>
  >((acc, detail) => {
    if (!detail.penjualan_id) {
      return acc;
    }

    acc[detail.penjualan_id] = (acc[detail.penjualan_id] ?? 0) + Number(detail.qty ?? 0);
    return acc;
  }, {});

  const pelangganById = Object.fromEntries(
    (pelangganResult.data ?? []).map((item) => [item.id, item.nama])
  );

  const metodeBySale = ((pembayaranResult.data ?? []) as PembayaranRow[]).reduce<Record<string, MetodePembayaran>>((acc, row) => {
    if (
      row.penjualan_id &&
      (row.metode === "tunai" || row.metode === "transfer" || row.metode === "accurate") &&
      !acc[row.penjualan_id]
    ) {
      acc[row.penjualan_id] = row.metode;
    }
    return acc;
  }, {});

  const mappedRows = rows.map<SalesReportRow>((row) => {
    const pelangganId = row.pelanggan_id ?? "";
    const kategori = metodeBySale[row.id] ?? "tunai";

    return {
      id: row.id,
      tanggal: row.tanggal ?? row.created_at ?? "",
      referensi: row.nomor_invoice,
      kategori,
      nilai: Number(row.grand_total ?? 0),
      status: row.status ?? "selesai",
      pelanggan: pelangganId ? pelangganById[pelangganId] ?? "Umum" : "Umum",
      subtotal: Number(row.subtotal ?? 0),
      diskon: Number(row.diskon_total ?? 0),
      pajak: Number(row.pajak_total ?? 0),
      bayar: Number(row.bayar_total ?? 0),
      kembalian: Number(row.kembalian ?? 0),
      itemCount: itemCountBySale[row.id] ?? 0
    };
  });

  const filteredRows =
    params.metodePembayaran && params.metodePembayaran !== "semua"
      ? mappedRows.filter((row) => row.kategori === params.metodePembayaran)
      : mappedRows;

  return matchSearch(filteredRows, params.search, [
    "referensi",
    "pelanggan",
    "kategori",
    "status"
  ]);
}

function localLabaRugiRows(): ReportRow[] {
  return penjualan.map((item) => ({
    id: item.id,
    tanggal: item.tanggal,
    referensi: item.nomorInvoice,
    kategori: "Laba kotor",
    nilai: item.details.reduce((sum, detail) => sum + (detail.subtotal - detail.hargaPokok * detail.jumlah), 0),
    status: item.status
  }));
}

async function supabaseLabaRugiRows(): Promise<ReportRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from("penjualan").select("*").order("tanggal", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PenjualanRow[];
  const ids = rows.map((row) => row.id);

  const detailResult = ids.length
    ? await supabase.from("penjualan_detail").select("penjualan_id,qty,harga_pokok").in("penjualan_id", ids)
    : { data: [], error: null };

  if (detailResult.error) {
    throw new Error(detailResult.error.message);
  }

  const hppBySale = (detailResult.data ?? []).reduce<Record<string, number>>((acc, row) => {
    if (!row.penjualan_id) {
      return acc;
    }

    acc[row.penjualan_id] = (acc[row.penjualan_id] ?? 0) + Number(row.qty ?? 0) * Number(row.harga_pokok ?? 0);
    return acc;
  }, {});

  return rows.map((row) => ({
    id: row.id,
    tanggal: row.tanggal ?? row.created_at ?? "",
    referensi: row.nomor_invoice,
    kategori: "Laba kotor",
    nilai: Number(row.grand_total ?? 0) - (hppBySale[row.id] ?? 0),
    status: row.status ?? "selesai"
  }));
}

export const laporanService = {
  async labaRugiReport(): Promise<ReportRow[]> {
    return isSupabaseConfigured ? supabaseLabaRugiRows() : localLabaRugiRows();
  },

  async pembelianReport(): Promise<ReportRow[]> {
    const result = await pembelianService.list({ perPage: 9999 });
    return result.data.map((item) => ({
      id: item.id,
      tanggal: item.tanggalFaktur,
      referensi: item.nomorInternal,
      kategori: item.namaSupplier,
      nilai: item.grandTotal,
      status: item.status
    }));
  },

  async stokReport(): Promise<ReportRow[]> {
    const result = await pembelianService.list({ perPage: 9999 });
    return result.data
      .filter((item) => item.status === "diterima")
      .flatMap((item) =>
        item.details.map((detail) => ({
          id: detail.id,
          tanggal: item.tanggalFaktur,
          referensi: detail.batchNumber || item.nomorInternal,
          kategori: detail.namaBarang,
          nilai: detail.jumlah,
          status: item.namaSupplier
        }))
      );
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
