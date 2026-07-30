import { defaultCabangId } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  Penjualan,
  PenjualanDetail,
  ReturPenjualan,
  ReturPenjualanDetail,
  StatusRetur
} from "@/types";
import { penjualanService } from "./penjualanService";
import { getCurrentUserId, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface ReturPenjualanItemInput {
  penjualanDetailId: string;
  penjualanId: string;
  barangId: string;
  satuanId?: string;
  jumlah: number;
  hargaJual: number;
}

export interface ReturPenjualanInput {
  cabangId?: string;
  pelangganId: string;
  penjualanId: string;
  tanggal: string;
  alasan: string;
  status?: StatusRetur;
  items: ReturPenjualanItemInput[];
}

export interface ReturablePenjualanDetail extends PenjualanDetail {
  sudahDiretur: number;
  sisaRetur: number;
}

export interface ReturablePenjualan extends Omit<Penjualan, "details"> {
  details: ReturablePenjualanDetail[];
}

interface ReturRow {
  id: string;
  cabang_id: string | null;
  pelanggan_id: string | null;
  penjualan_id: string | null;
  nomor: string;
  tanggal: string | null;
  alasan: string | null;
  total: number | string | null;
  status: StatusRetur | null;
  dibuat_oleh: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ReturDetailRow {
  id: string;
  retur_penjualan_id: string | null;
  penjualan_id: string | null;
  penjualan_detail_id: string | null;
  barang_id: string | null;
  satuan_id: string | null;
  qty: number | string | null;
  stock_qty: number | string | null;
  harga_jual: number | string | null;
  subtotal: number | string | null;
}

interface ReturStockMutationRow {
  id?: string;
  cabang_id?: string | null;
  sumber_id: string | null;
  barang_id: string | null;
  batch_id?: string | null;
  qty_masuk: number | string | null;
  qty_keluar?: number | string | null;
  tipe_mutasi?: string | null;
  sumber_tabel?: string | null;
  saldo_akhir?: number | string | null;
  harga_pokok?: number | string | null;
  keterangan?: string | null;
}

interface SaleStockMutationRow {
  batch_id: string | null;
  qty_keluar: number | string | null;
}

const localReturPenjualan: ReturPenjualan[] = [];
const localReturStorageKey = "apotek-retur-penjualan";
let localReturHydrated = false;
const nullBatchKey = "__tanpa_batch__";
type ReturStockQtyByBatch = Record<string, Record<string, Record<string, number>>>;

function hydrateLocalReturPenjualan() {
  if (localReturHydrated || typeof window === "undefined") return;
  localReturHydrated = true;

  try {
    const stored = window.localStorage.getItem(localReturStorageKey);
    const rows = stored ? (JSON.parse(stored) as ReturPenjualan[]) : [];
    for (const row of rows) {
      if (row?.id && !localReturPenjualan.some((item) => item.id === row.id)) {
        localReturPenjualan.push(row);
      }
    }
  } catch {
    window.localStorage.removeItem(localReturStorageKey);
  }
}

function persistLocalReturPenjualan() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    localReturStorageKey,
    JSON.stringify(localReturPenjualan)
  );
}

function addLocalRetur(retur: ReturPenjualan) {
  hydrateLocalReturPenjualan();
  const index = localReturPenjualan.findIndex((item) => item.id === retur.id);
  if (index >= 0) localReturPenjualan.splice(index, 1);
  localReturPenjualan.unshift(retur);
  persistLocalReturPenjualan();
}

function isMissingReturTable(error: { message?: string; code?: string } | null) {
  return (
    error?.code === "42P01" ||
    error?.message?.includes("retur_penjualan") ||
    error?.message?.includes("schema cache")
  );
}

function returTableMessage() {
  return "Tabel retur penjualan belum ada di Supabase. Jalankan database/retur_penjualan.sql di SQL Editor Supabase.";
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function generateNomor(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(Date.now()).slice(-5);
  return `RJ-${stamp}-${suffix}`;
}

function calculateTotal(items: ReturPenjualanItemInput[]) {
  return items.reduce((sum, item) => sum + item.jumlah * item.hargaJual, 0);
}

function stockQtyFromDetail(detail: Pick<ReturPenjualanDetail, "jumlah" | "stockQty">) {
  const stockQty = Number(detail.stockQty ?? detail.jumlah);
  return Number.isFinite(stockQty) ? Math.max(0, stockQty) : 0;
}

function groupReturStockByBarang(retur: ReturPenjualan) {
  const grouped = retur.details.reduce<Record<string, number>>((acc, detail) => {
    if (!detail.barangId) return acc;
    acc[detail.barangId] =
      (acc[detail.barangId] ?? 0) + stockQtyFromDetail(detail);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([barangId, qty]) => ({ barangId, qty }))
    .filter((item) => item.qty > 0);
}

function batchKey(batchId?: string | null) {
  return batchId ?? nullBatchKey;
}

export function resolveReturStockQty(
  jumlah: number,
  nilaiKonversi?: number | null
) {
  return nilaiKonversi && nilaiKonversi > 1 ? jumlah / nilaiKonversi : jumlah;
}

function filterRetur(rows: ReturPenjualan[], search?: string) {
  return matchSearch(rows, search, [
    "nomor",
    "namaPelanggan",
    "nomorInvoice",
    "alasan",
    "status"
  ]);
}

async function resolvePenggunaId(): Promise<string | null> {
  const current = getCurrentUserId();

  if (!isSupabaseConfigured || !supabase || !current) {
    return null;
  }

  const { data } = await supabase
    .from("pengguna")
    .select("id")
    .eq("id", current)
    .maybeSingle();

  return data?.id ? (data.id as string) : null;
}

async function loadLookupMaps() {
  if (!supabase) {
    return {
      pelangganById: {} as Record<string, string>,
      penjualanById: {} as Record<string, string>,
      obatById: {} as Record<string, string>,
      satuanById: {} as Record<string, string>
    };
  }

  const [pelangganResult, penjualanResult, obatResult, satuanResult] =
    await Promise.all([
      supabase.from("pelanggan").select("id,nama"),
      supabase.from("penjualan").select("id,nomor_invoice"),
      supabase.from("barang").select("id,nama"),
      supabase.from("satuan").select("id,nama")
    ]);

  if (pelangganResult.error) throw new Error(pelangganResult.error.message);
  if (penjualanResult.error) throw new Error(penjualanResult.error.message);
  if (obatResult.error) throw new Error(obatResult.error.message);
  if (satuanResult.error) throw new Error(satuanResult.error.message);

  return {
    pelangganById: Object.fromEntries(
      (pelangganResult.data ?? []).map((item) => [item.id, item.nama])
    ),
    penjualanById: Object.fromEntries(
      (penjualanResult.data ?? []).map((item) => [
        item.id,
        item.nomor_invoice
      ])
    ),
    obatById: Object.fromEntries(
      (obatResult.data ?? []).map((item) => [item.id, item.nama])
    ),
    satuanById: Object.fromEntries(
      (satuanResult.data ?? []).map((item) => [item.id, item.nama])
    )
  };
}

function toDetail(
  row: ReturDetailRow,
  lookupMaps: {
    obatById: Record<string, string>;
    satuanById: Record<string, string>;
  }
): ReturPenjualanDetail {
  const barangId = row.barang_id ?? "";
  const satuanId = row.satuan_id ?? undefined;
  const stockQty = toNumber(row.stock_qty);

  return {
    id: row.id,
    returId: row.retur_penjualan_id ?? "",
    penjualanId: row.penjualan_id ?? "",
    penjualanDetailId: row.penjualan_detail_id ?? "",
    barangId,
    namaBarang: lookupMaps.obatById[barangId] ?? "-",
    satuanId,
    satuanNama: satuanId ? lookupMaps.satuanById[satuanId] : undefined,
    jumlah: toNumber(row.qty),
    stockQty: stockQty > 0 ? stockQty : toNumber(row.qty),
    hargaJual: toNumber(row.harga_jual),
    subtotal: toNumber(row.subtotal)
  };
}

function toRetur(
  row: ReturRow,
  details: ReturPenjualanDetail[] = [],
  lookupMaps: {
    pelangganById: Record<string, string>;
    penjualanById: Record<string, string>;
  }
): ReturPenjualan {
  const pelangganId = row.pelanggan_id ?? "";
  const penjualanId = row.penjualan_id ?? "";

  return {
    id: row.id,
    cabangId: row.cabang_id ?? "",
    nomor: row.nomor,
    pelangganId,
    namaPelanggan: lookupMaps.pelangganById[pelangganId] ?? "-",
    penjualanId,
    nomorInvoice: lookupMaps.penjualanById[penjualanId] ?? "-",
    tanggal: row.tanggal ?? "",
    alasan: row.alasan ?? "",
    total: toNumber(row.total),
    status: row.status ?? "draft",
    createdBy: row.dibuat_oleh ?? undefined,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    details
  };
}

async function loadDetailsForRetur(ids: string[]) {
  if (!supabase || !ids.length) {
    return {} as Record<string, ReturPenjualanDetail[]>;
  }

  const [{ data, error }, lookupMaps] = await Promise.all([
    supabase
      .from("retur_penjualan_detail")
      .select("*")
      .in("retur_penjualan_id", ids),
    loadLookupMaps()
  ]);

  if (error) {
    if (isMissingReturTable(error)) return {};
    throw new Error(error.message);
  }

  const fallbackSatuanByDetail = await loadSaleSatuanByDetail(
    ((data ?? []) as ReturDetailRow[]).map(
      (row) => row.penjualan_detail_id ?? ""
    )
  );

  return ((data ?? []) as ReturDetailRow[]).reduce<
    Record<string, ReturPenjualanDetail[]>
  >((acc, row) => {
    const detail = toDetail(
      {
        ...row,
        satuan_id:
          row.satuan_id ?? fallbackSatuanByDetail[row.penjualan_detail_id ?? ""]
      },
      lookupMaps
    );
    acc[detail.returId] = [...(acc[detail.returId] ?? []), detail];
    return acc;
  }, {});
}

async function loadSaleSatuanByDetail(detailIds: string[]) {
  if (!supabase) return {} as Record<string, string>;

  const ids = [...new Set(detailIds.filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from("penjualan_detail")
    .select("id,satuan_id")
    .in("id", ids);

  if (error) throw new Error(error.message);

  return Object.fromEntries(
    (data ?? [])
      .filter((row) => row.satuan_id)
      .map((row) => [row.id, row.satuan_id])
  );
}

function localReturnedQtyByDetail() {
  hydrateLocalReturPenjualan();
  return localReturPenjualan.reduce<Record<string, number>>((acc, retur) => {
    if (retur.status === "dibatalkan") return acc;
    for (const detail of retur.details) {
      acc[detail.penjualanDetailId] =
        (acc[detail.penjualanDetailId] ?? 0) + detail.jumlah;
    }
    return acc;
  }, {});
}

async function loadReturnedQtyByDetail(detailIds: string[]) {
  if (!detailIds.length) return {} as Record<string, number>;
  const localReturned = localReturnedQtyByDetail();

  if (!isSupabaseConfigured || !supabase) {
    return localReturned;
  }

  const returResult = await supabase
    .from("retur_penjualan")
    .select("id,status")
    .neq("status", "dibatalkan");

  if (returResult.error) {
    if (isMissingReturTable(returResult.error)) return localReturned;
    throw new Error(returResult.error.message);
  }

  const returIds = (returResult.data ?? []).map((row) => row.id);
  if (!returIds.length) return localReturned;

  const { data, error } = await supabase
    .from("retur_penjualan_detail")
    .select("penjualan_detail_id,qty")
    .in("retur_penjualan_id", returIds)
    .in("penjualan_detail_id", detailIds);

  if (error) {
    if (isMissingReturTable(error)) return localReturned;
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const id = row.penjualan_detail_id as string | null;
    if (id) acc[id] = (acc[id] ?? 0) + toNumber(row.qty);
    return acc;
  }, localReturned);
}

function conversionKey(barangId: string, satuanId?: string) {
  return `${barangId}:${satuanId ?? ""}`;
}

async function loadReturConversionByDetail(
  details: Array<{ barangId: string; satuanId?: string }>
) {
  if (!isSupabaseConfigured || !supabase || !details.length) {
    return {} as Record<string, number>;
  }

  const barangIds = [...new Set(details.map((item) => item.barangId))];
  const [{ data: barangRows, error: barangError }, { data, error }] =
    await Promise.all([
      supabase.from("barang").select("id,satuan_default_id").in("id", barangIds),
      supabase
        .from("konversi_satuan")
        .select("barang_id,satuan_dari_id,satuan_ke_id,nilai_konversi")
        .in("barang_id", barangIds)
    ]);

  if (barangError) throw new Error(barangError.message);
  if (error) throw new Error(error.message);

  const defaultByBarang = Object.fromEntries(
    (barangRows ?? []).map((row) => [row.id, row.satuan_default_id])
  );

  return (data ?? []).reduce<Record<string, number>>((acc, row) => {
    if (
      row.barang_id &&
      row.satuan_ke_id &&
      row.satuan_dari_id === defaultByBarang[row.barang_id]
    ) {
      acc[conversionKey(row.barang_id, row.satuan_ke_id)] = toNumber(
        row.nilai_konversi
      );
    }
    return acc;
  }, {});
}

async function changeSaldoStok(
  cabangId: string,
  barangId: string,
  batchId: string | null,
  deltaQty: number
) {
  if (!supabase || deltaQty === 0) {
    return 0;
  }

  let saldoQuery = supabase
    .from("saldo_stok")
    .select("id,qty")
    .eq("cabang_id", cabangId)
    .eq("barang_id", barangId);
  saldoQuery = batchId
    ? saldoQuery.eq("batch_id", batchId)
    : saldoQuery.is("batch_id", null);

  const { data: saldoRows, error: findError } = await saldoQuery.limit(1);

  if (findError) throw new Error(findError.message);

  const existingSaldo = saldoRows?.[0];
  const saldoAkhir = Math.max(0, toNumber(existingSaldo?.qty) + deltaQty);

  if (existingSaldo?.id) {
    const { error } = await supabase
      .from("saldo_stok")
      .update({ qty: saldoAkhir, updated_at: new Date().toISOString() })
      .eq("id", existingSaldo.id);
    if (error) throw new Error(error.message);
    return saldoAkhir;
  }

  if (deltaQty > 0) {
    const { error } = await supabase.from("saldo_stok").insert({
      cabang_id: cabangId,
      barang_id: barangId,
      batch_id: batchId,
      qty: saldoAkhir
    });
    if (error) throw new Error(error.message);
  }

  return saldoAkhir;
}

async function loadSaleBatchPlan(
  retur: ReturPenjualan,
  barangId: string,
  qty: number
) {
  if (!supabase || !retur.penjualanId || qty <= 0) {
    return [{ batchId: null, qty }];
  }

  const { data, error } = await supabase
    .from("kartu_stok")
    .select("batch_id,qty_keluar")
    .eq("sumber_tabel", "penjualan")
    .eq("sumber_id", retur.penjualanId)
    .eq("barang_id", barangId)
    .gt("qty_keluar", 0)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  let remaining = qty;
  const planned = ((data ?? []) as SaleStockMutationRow[]).reduce<
    Array<{ batchId: string | null; qty: number }>
  >((acc, row) => {
    if (remaining <= 0) return acc;

    const take = Math.min(toNumber(row.qty_keluar), remaining);
    if (take > 0) {
      acc.push({ batchId: row.batch_id ?? null, qty: take });
      remaining -= take;
    }
    return acc;
  }, []);

  if (remaining > 0.000001) {
    planned.push({ batchId: null, qty: remaining });
  }

  return Object.values(
    planned.reduce<Record<string, { batchId: string | null; qty: number }>>(
      (acc, item) => {
        const key = batchKey(item.batchId);
        acc[key] = {
          batchId: item.batchId,
          qty: (acc[key]?.qty ?? 0) + item.qty
        };
        return acc;
      },
      {}
    )
  );
}

async function addStockMovementForRetur(
  retur: ReturPenjualan,
  barangId: string,
  stockQty: number,
  batchId: string | null = null
) {
  if (!isSupabaseConfigured || !supabase || stockQty <= 0) {
    return;
  }

  const cabangId = retur.cabangId || defaultCabangId;
  const saldoAkhir = await changeSaldoStok(cabangId, barangId, batchId, stockQty);

  const { error: kartuError } = await supabase.from("kartu_stok").insert({
    cabang_id: cabangId,
    barang_id: barangId,
    batch_id: batchId,
    tipe_mutasi: "masuk",
    sumber_tabel: "retur_penjualan",
    sumber_id: retur.id,
    qty_masuk: stockQty,
    qty_keluar: 0,
    saldo_akhir: saldoAkhir,
    harga_pokok: 0,
    keterangan: `Retur penjualan ${retur.nomor}: ${retur.alasan}`
  });

  if (kartuError) throw new Error(kartuError.message);
}

async function moveExistingNullBatchReturStock(
  retur: ReturPenjualan,
  barangId: string,
  targetBatchId: string,
  qty: number
) {
  if (!isSupabaseConfigured || !supabase || qty <= 0) {
    return 0;
  }

  const cabangId = retur.cabangId || defaultCabangId;
  const { data, error } = await supabase
    .from("kartu_stok")
    .select(
      "id,cabang_id,barang_id,batch_id,tipe_mutasi,sumber_tabel,sumber_id,qty_masuk,qty_keluar,saldo_akhir,harga_pokok,keterangan"
    )
    .eq("sumber_tabel", "retur_penjualan")
    .eq("sumber_id", retur.id)
    .eq("barang_id", barangId)
    .is("batch_id", null)
    .gt("qty_masuk", 0)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  let remaining = qty;
  let moved = 0;

  for (const row of (data ?? []) as ReturStockMutationRow[]) {
    if (remaining <= 0) break;

    const rowQty = toNumber(row.qty_masuk);
    const take = Math.min(rowQty, remaining);
    if (!row.id || take <= 0) continue;

    await changeSaldoStok(cabangId, barangId, null, -take);
    const targetSaldo = await changeSaldoStok(cabangId, barangId, targetBatchId, take);

    if (Math.abs(take - rowQty) <= 0.000001) {
      const { error: updateError } = await supabase
        .from("kartu_stok")
        .update({ batch_id: targetBatchId, saldo_akhir: targetSaldo })
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);
    } else {
      const { error: updateError } = await supabase
        .from("kartu_stok")
        .update({ qty_masuk: rowQty - take })
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);

      const { error: insertError } = await supabase.from("kartu_stok").insert({
        cabang_id: row.cabang_id ?? cabangId,
        barang_id: barangId,
        batch_id: targetBatchId,
        tipe_mutasi: row.tipe_mutasi ?? "masuk",
        sumber_tabel: row.sumber_tabel ?? "retur_penjualan",
        sumber_id: row.sumber_id ?? retur.id,
        qty_masuk: take,
        qty_keluar: row.qty_keluar ?? 0,
        saldo_akhir: targetSaldo,
        harga_pokok: row.harga_pokok ?? 0,
        keterangan: row.keterangan ?? `Retur penjualan ${retur.nomor}: ${retur.alasan}`
      });
      if (insertError) throw new Error(insertError.message);
    }

    moved += take;
    remaining -= take;
  }

  return moved;
}

async function addStockForRetur(retur: ReturPenjualan) {
  if (!isSupabaseConfigured || !supabase || !retur.details.length) {
    return;
  }

  for (const item of groupReturStockByBarang(retur)) {
    const plan = await loadSaleBatchPlan(retur, item.barangId, item.qty);
    for (const movement of plan) {
      await addStockMovementForRetur(
        retur,
        item.barangId,
        movement.qty,
        movement.batchId
      );
    }
  }
}

async function loadStockMutationQtyByRetur(returIds: string[]) {
  if (!isSupabaseConfigured || !supabase || !returIds.length) {
    return {} as ReturStockQtyByBatch;
  }

  const { data, error } = await supabase
    .from("kartu_stok")
    .select("sumber_id,barang_id,batch_id,qty_masuk")
    .eq("sumber_tabel", "retur_penjualan")
    .in("sumber_id", returIds);

  if (error) throw new Error(error.message);

  return ((data ?? []) as ReturStockMutationRow[]).reduce<ReturStockQtyByBatch>((acc, row) => {
    const returId = row.sumber_id ?? "";
    const barangId = row.barang_id ?? "";
    if (!returId || !barangId) return acc;

    acc[returId] = {
      ...(acc[returId] ?? {})
    };
    acc[returId][barangId] = {
      ...(acc[returId][barangId] ?? {}),
      [batchKey(row.batch_id)]:
        (acc[returId][barangId]?.[batchKey(row.batch_id)] ?? 0) +
        toNumber(row.qty_masuk)
    };
    return acc;
  }, {});
}

async function ensureStockForRetur(
  retur: ReturPenjualan,
  postedQtyByBarang: Record<string, Record<string, number>> = {}
) {
  if (!isSupabaseConfigured || !supabase || retur.status !== "posted") {
    return;
  }

  for (const item of groupReturStockByBarang(retur)) {
    const plan = await loadSaleBatchPlan(retur, item.barangId, item.qty);
    const postedByBatch = { ...(postedQtyByBarang[item.barangId] ?? {}) };

    for (const movement of plan) {
      if (!movement.batchId) continue;

      const key = batchKey(movement.batchId);
      const missingQty = movement.qty - (postedByBatch[key] ?? 0);
      const nullQty = postedByBatch[nullBatchKey] ?? 0;
      if (missingQty > 0.000001 && nullQty > 0) {
        const moved = await moveExistingNullBatchReturStock(
          retur,
          item.barangId,
          movement.batchId,
          Math.min(missingQty, nullQty)
        );
        postedByBatch[key] = (postedByBatch[key] ?? 0) + moved;
        postedByBatch[nullBatchKey] = Math.max(0, nullQty - moved);
      }
    }

    for (const movement of plan) {
      const key = batchKey(movement.batchId);
      const missingQty = movement.qty - (postedByBatch[key] ?? 0);
      if (missingQty > 0.000001) {
        await addStockMovementForRetur(
          retur,
          item.barangId,
          missingQty,
          movement.batchId
        );
      }
    }
  }
}

async function ensureStockForReturRows(rows: ReturPenjualan[]) {
  const postedRows = rows.filter(
    (item) => item.status === "posted" && item.details.length
  );

  if (!postedRows.length) {
    return;
  }

  const postedQtyByRetur = await loadStockMutationQtyByRetur(
    postedRows.map((item) => item.id)
  );

  await Promise.all(
    postedRows.map((item) =>
      ensureStockForRetur(item, postedQtyByRetur[item.id] ?? {})
    )
  );
}

async function stockOnlyRetur(retur: ReturPenjualan) {
  // Fallback sampai tabel retur_penjualan dibuat; audit lengkap butuh database/retur_penjualan.sql.
  const normalized = {
    ...retur,
    details: retur.details.map((detail) => ({ ...detail, returId: retur.id }))
  };
  await addStockForRetur(normalized);
  addLocalRetur(normalized);
  return normalized;
}

export const returPenjualanService = {
  async list(params: ListParams = {}) {
    hydrateLocalReturPenjualan();

    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterRetur(localReturPenjualan, params.search), params);
    }

    const [{ data, error }, lookupMaps] = await Promise.all([
      supabase
        .from("retur_penjualan")
        .select("*")
        .order("created_at", { ascending: false }),
      loadLookupMaps()
    ]);

    if (error) {
      if (isMissingReturTable(error)) {
        await ensureStockForReturRows(localReturPenjualan);
        return paginate(filterRetur(localReturPenjualan, params.search), params);
      }
      throw new Error(error.message);
    }

    const rows = (data ?? []) as ReturRow[];
    const detailByRetur = await loadDetailsForRetur(rows.map((item) => item.id));

    const remoteRows = rows.map((item) =>
      toRetur(item, detailByRetur[item.id] ?? [], lookupMaps)
    );
    await ensureStockForReturRows(remoteRows);

    const result = filterRetur(
      [
        ...localReturPenjualan,
        ...remoteRows.filter(
          (remote) =>
            !localReturPenjualan.some((local) => local.id === remote.id)
        )
      ],
      params.search
    );

    return paginate(result, params);
  },

  async salesByPelanggan(pelangganId: string): Promise<ReturablePenjualan[]> {
    if (!pelangganId) return [];

    const result = await penjualanService.list({ perPage: 1000 });
    const sales = result.data.filter(
      (sale) => sale.pelangganId === pelangganId && sale.status !== "dibatalkan"
    );
    const detailIds = sales.flatMap((sale) =>
      sale.details.map((detail) => detail.id)
    );
    const returnedByDetail = await loadReturnedQtyByDetail(detailIds);

    return sales.flatMap((sale) => {
      const details = sale.details.map((detail) => {
        const sudahDiretur = returnedByDetail[detail.id] ?? 0;
        return {
          ...detail,
          sudahDiretur,
          sisaRetur: Math.max(0, detail.jumlah - sudahDiretur)
        };
      }).filter((detail) => detail.sisaRetur > 0);

      return details.length ? [{ ...sale, details }] : [];
    });
  },

  async create(payload: ReturPenjualanInput): Promise<ReturPenjualan> {
    if (!payload.pelangganId) throw new Error("Pelanggan wajib dipilih");
    if (!payload.penjualanId) throw new Error("Transaksi penjualan wajib dipilih");
    if (!payload.alasan.trim()) throw new Error("Alasan retur wajib diisi");
    if (!payload.items.length) throw new Error("Minimal satu item wajib diretur");

    const sales = await this.salesByPelanggan(payload.pelangganId);
    const sale = sales.find((item) => item.id === payload.penjualanId);
    if (!sale) throw new Error("Transaksi penjualan tidak ditemukan");

    for (const item of payload.items) {
      const detail = sale.details.find(
        (row) => row.id === item.penjualanDetailId
      );
      if (!detail) throw new Error("Item retur tidak ditemukan di invoice");
      if (item.jumlah <= 0 || item.jumlah > detail.sisaRetur) {
        throw new Error(
          `Jumlah retur ${detail.namaBarang} melebihi sisa yang bisa diretur (${detail.sisaRetur}).`
        );
      }
    }

    const conversionByDetail = await loadReturConversionByDetail(payload.items);
    const buildDetails = (returId: string): ReturPenjualanDetail[] =>
      payload.items.map((item) => {
        const detail = sale.details.find(
          (row) => row.id === item.penjualanDetailId
        )!;
        const stockQty = resolveReturStockQty(
          item.jumlah,
          conversionByDetail[conversionKey(item.barangId, item.satuanId)]
        );

        return {
          id: crypto.randomUUID(),
          returId,
          penjualanId: sale.id,
          penjualanDetailId: item.penjualanDetailId,
          barangId: item.barangId,
          namaBarang: detail.namaBarang,
          satuanId: item.satuanId,
          satuanNama: detail.satuanNama,
          jumlah: item.jumlah,
          stockQty,
          hargaJual: item.hargaJual,
          subtotal: item.jumlah * item.hargaJual
        };
      });

    const total = calculateTotal(payload.items);
    const status = payload.status ?? "posted";
    const nomor = generateNomor(new Date(payload.tanggal || Date.now()));

    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const created: ReturPenjualan = {
        id,
        cabangId: payload.cabangId || sale.cabangId || defaultCabangId,
        nomor,
        pelangganId: payload.pelangganId,
        namaPelanggan: sale.namaPelanggan,
        penjualanId: sale.id,
        nomorInvoice: sale.nomorInvoice,
        tanggal: payload.tanggal,
        alasan: payload.alasan,
        total,
        status,
        createdAt: now,
        updatedAt: now,
        details: buildDetails(id)
      };

      addLocalRetur(created);
      return created;
    }

    const dibuatOleh = await resolvePenggunaId();
    const cabangId = payload.cabangId || sale.cabangId || defaultCabangId;

    const { data, error } = await supabase
      .from("retur_penjualan")
      .insert({
        cabang_id: cabangId,
        pelanggan_id: payload.pelangganId,
        penjualan_id: payload.penjualanId,
        nomor,
        tanggal: payload.tanggal || null,
        alasan: payload.alasan,
        total,
        status,
        dibuat_oleh: dibuatOleh,
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    const fallbackRetur: ReturPenjualan = {
      id: crypto.randomUUID(),
      cabangId,
      nomor,
      pelangganId: payload.pelangganId,
      namaPelanggan: sale.namaPelanggan,
      penjualanId: sale.id,
      nomorInvoice: sale.nomorInvoice,
      tanggal: payload.tanggal,
      alasan: payload.alasan,
      total,
      status,
      createdBy: dibuatOleh ?? undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      details: buildDetails("")
    };

    if (error) {
      if (isMissingReturTable(error)) {
        return stockOnlyRetur(fallbackRetur);
      }
      throw new Error(error.message);
    }

    const { error: detailError } = await supabase
      .from("retur_penjualan_detail")
      .insert(
        payload.items.map((item) => ({
          retur_penjualan_id: data.id,
          penjualan_id: item.penjualanId,
          penjualan_detail_id: item.penjualanDetailId,
          barang_id: item.barangId,
          satuan_id: item.satuanId ?? null,
          qty: item.jumlah,
          stock_qty:
            resolveReturStockQty(
              item.jumlah,
              conversionByDetail[conversionKey(item.barangId, item.satuanId)]
            ),
          harga_jual: item.hargaJual,
          subtotal: item.jumlah * item.hargaJual
        }))
      );

    if (detailError) {
      if (isMissingReturTable(detailError)) {
        return stockOnlyRetur({ ...fallbackRetur, id: data.id });
      }
      throw new Error(detailError.message);
    }

    const created: ReturPenjualan = {
      id: data.id,
      cabangId,
      nomor,
      pelangganId: payload.pelangganId,
      namaPelanggan: sale.namaPelanggan,
      penjualanId: sale.id,
      nomorInvoice: sale.nomorInvoice,
      tanggal: payload.tanggal,
      alasan: payload.alasan,
      total,
      status,
      createdBy: dibuatOleh ?? undefined,
      createdAt: data.created_at ?? "",
      updatedAt: data.updated_at ?? "",
      details: buildDetails(data.id)
    };

    if (status === "posted") await addStockForRetur(created);

    return created;
  }
};
