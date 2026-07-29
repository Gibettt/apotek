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

const localReturPenjualan: ReturPenjualan[] = [];
const localReturStorageKey = "apotek-retur-penjualan";
let localReturHydrated = false;

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

async function addStockForRetur(retur: ReturPenjualan) {
  if (!isSupabaseConfigured || !supabase || !retur.details.length) {
    return;
  }

  const cabangId = retur.cabangId || defaultCabangId;

  for (const detail of retur.details) {
    const stockQty = detail.stockQty ?? detail.jumlah;
    const { data: existingSaldo, error: findError } = await supabase
      .from("saldo_stok")
      .select("id,qty")
      .eq("cabang_id", cabangId)
      .eq("barang_id", detail.barangId)
      .is("batch_id", null)
      .maybeSingle();

    if (findError) throw new Error(findError.message);

    const saldoAkhir = toNumber(existingSaldo?.qty) + stockQty;

    if (existingSaldo?.id) {
      const { error } = await supabase
        .from("saldo_stok")
        .update({ qty: saldoAkhir, updated_at: new Date().toISOString() })
        .eq("id", existingSaldo.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("saldo_stok").insert({
        cabang_id: cabangId,
        barang_id: detail.barangId,
        batch_id: null,
        qty: stockQty
      });
      if (error) throw new Error(error.message);
    }

    const { error: kartuError } = await supabase.from("kartu_stok").insert({
      cabang_id: cabangId,
      barang_id: detail.barangId,
      batch_id: null,
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
}

async function stockOnlyRetur(retur: ReturPenjualan) {
  // ponytail: fallback sampai tabel retur_penjualan dibuat; audit lengkap butuh database/retur_penjualan.sql.
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
        return paginate(filterRetur(localReturPenjualan, params.search), params);
      }
      throw new Error(error.message);
    }

    const rows = (data ?? []) as ReturRow[];
    const detailByRetur = await loadDetailsForRetur(rows.map((item) => item.id));

    const remoteRows = rows.map((item) =>
      toRetur(item, detailByRetur[item.id] ?? [], lookupMaps)
    );
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
