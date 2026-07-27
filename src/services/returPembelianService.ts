import { defaultCabangId } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ReturPembelian, ReturPembelianDetail, StatusRetur } from "@/types";
import { getCurrentUserId, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface ReturPembelianItemInput {
  barangId: string;
  batchId?: string | null;
  jumlah: number;
  hargaBeli: number;
}

export interface ReturPembelianInput {
  cabangId?: string;
  supplierId: string;
  pembelianId?: string;
  tanggal: string;
  alasan: string;
  status?: StatusRetur;
  items: ReturPembelianItemInput[];
}

interface ReturRow {
  id: string;
  cabang_id: string | null;
  nomor: string;
  supplier_id: string | null;
  pembelian_id: string | null;
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
  retur_pembelian_id: string | null;
  barang_id: string | null;
  batch_id: string | null;
  qty: number | null;
  harga_beli: number | string | null;
  subtotal: number | string | null;
}

const localRetur: ReturPembelian[] = [];

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function generateNomor(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(Date.now()).slice(-5);
  return `RB-${stamp}-${suffix}`;
}

function calculateTotal(items: ReturPembelianItemInput[]) {
  return items.reduce((sum, item) => sum + item.jumlah * item.hargaBeli, 0);
}

function toDetail(row: ReturDetailRow, obatById: Record<string, string> = {}): ReturPembelianDetail {
  const barangId = row.barang_id ?? "";

  return {
    id: row.id,
    returId: row.retur_pembelian_id ?? "",
    barangId,
    namaBarang: obatById[barangId] ?? "-",
    batchId: row.batch_id ?? undefined,
    jumlah: Number(row.qty ?? 0),
    hargaBeli: toNumber(row.harga_beli),
    subtotal: toNumber(row.subtotal)
  };
}

function toRetur(
  row: ReturRow,
  details: ReturPembelianDetail[] = [],
  supplierById: Record<string, string> = {}
): ReturPembelian {
  const supplierId = row.supplier_id ?? "";

  return {
    id: row.id,
    cabangId: row.cabang_id ?? "",
    nomor: row.nomor,
    supplierId,
    namaSupplier: supplierById[supplierId] ?? "-",
    pembelianId: row.pembelian_id ?? undefined,
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

function filterRetur(rows: ReturPembelian[], search?: string) {
  return matchSearch(rows, search, ["nomor", "namaSupplier", "alasan", "status"]);
}

async function loadLookupMaps() {
  if (!supabase) {
    return {
      supplierById: {} as Record<string, string>,
      obatById: {} as Record<string, string>
    };
  }

  const [supplierResult, obatResult] = await Promise.all([
    supabase.from("supplier").select("id,nama"),
    supabase.from("barang").select("id,nama")
  ]);

  if (supplierResult.error) {
    throw new Error(supplierResult.error.message);
  }

  if (obatResult.error) {
    throw new Error(obatResult.error.message);
  }

  return {
    supplierById: Object.fromEntries((supplierResult.data ?? []).map((item) => [item.id, item.nama])),
    obatById: Object.fromEntries((obatResult.data ?? []).map((item) => [item.id, item.nama]))
  };
}

async function loadDetailsForRetur(ids: string[]) {
  if (!supabase || !ids.length) {
    return {} as Record<string, ReturPembelianDetail[]>;
  }

  const [{ data, error }, lookupMaps] = await Promise.all([
    supabase.from("retur_pembelian_detail").select("*").in("retur_pembelian_id", ids),
    loadLookupMaps()
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ReturDetailRow[]).reduce<Record<string, ReturPembelianDetail[]>>((acc, row) => {
    const detail = toDetail(row, lookupMaps.obatById);
    acc[detail.returId] = [...(acc[detail.returId] ?? []), detail];
    return acc;
  }, {});
}

async function resolveCabangId(preferred?: string): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    return preferred || defaultCabangId;
  }

  if (preferred) {
    const { data } = await supabase.from("cabang").select("id").eq("id", preferred).maybeSingle();
    if (data?.id) {
      return data.id as string;
    }
  }

  const { data, error } = await supabase
    .from("cabang")
    .select("id")
    .eq("aktif", true)
    .order("nama", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Belum ada cabang terdaftar. Tambahkan data cabang terlebih dahulu.");
  }

  return data.id as string;
}

async function resolvePenggunaId(): Promise<string | null> {
  const current = getCurrentUserId();

  if (!isSupabaseConfigured || !supabase || !current) {
    return null;
  }

  const { data } = await supabase.from("pengguna").select("id").eq("id", current).maybeSingle();
  return data?.id ? (data.id as string) : null;
}

/** Sends returned goods back out of stock. Requires each item's batch to actually hold enough qty. */
async function reduceStockForRetur(retur: ReturPembelian) {
  if (!isSupabaseConfigured || !supabase || !retur.details.length) {
    return;
  }

  const cabangId = retur.cabangId || defaultCabangId;

  for (const detail of retur.details) {
    let saldoQuery = supabase
      .from("saldo_stok")
      .select("id,qty")
      .eq("cabang_id", cabangId)
      .eq("barang_id", detail.barangId);
    saldoQuery = detail.batchId ? saldoQuery.eq("batch_id", detail.batchId) : saldoQuery.is("batch_id", null);

    const { data: existingSaldo, error: findError } = await saldoQuery.maybeSingle();

    if (findError) {
      throw new Error(findError.message);
    }

    const tersedia = Number(existingSaldo?.qty ?? 0);

    if (detail.jumlah > tersedia) {
      throw new Error(
        `Stok ${detail.namaBarang} pada batch ini tidak mencukupi untuk retur. Tersedia ${tersedia}, diminta ${detail.jumlah}.`
      );
    }

    const saldoAkhir = tersedia - detail.jumlah;
    const { error: updateError } = await supabase
      .from("saldo_stok")
      .update({ qty: saldoAkhir, updated_at: new Date().toISOString() })
      .eq("id", existingSaldo!.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const { error: kartuError } = await supabase.from("kartu_stok").insert({
      cabang_id: cabangId,
      barang_id: detail.barangId,
      batch_id: detail.batchId ?? null,
      tipe_mutasi: "keluar",
      sumber_tabel: "retur_pembelian",
      sumber_id: retur.id,
      qty_masuk: 0,
      qty_keluar: detail.jumlah,
      saldo_akhir: saldoAkhir,
      harga_pokok: detail.hargaBeli,
      keterangan: `Retur pembelian ${retur.nomor}: ${retur.alasan}`
    });

    if (kartuError) {
      throw new Error(kartuError.message);
    }
  }
}

export const returPembelianService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterRetur(localRetur, params.search), params);
    }

    const [{ data, error }, lookupMaps] = await Promise.all([
      supabase.from("retur_pembelian").select("*").order("created_at", { ascending: false }),
      loadLookupMaps()
    ]);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as ReturRow[];
    const detailByRetur = await loadDetailsForRetur(rows.map((item) => item.id));

    const result = filterRetur(
      rows.map((item) => toRetur(item, detailByRetur[item.id] ?? [], lookupMaps.supplierById)),
      params.search
    );

    return paginate(result, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return localRetur.find((item) => item.id === id) ?? null;
    }

    const [{ data, error }, lookupMaps, detailByRetur] = await Promise.all([
      supabase.from("retur_pembelian").select("*").eq("id", id).single(),
      loadLookupMaps(),
      loadDetailsForRetur([id])
    ]);

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data ? toRetur(data, detailByRetur[id] ?? [], lookupMaps.supplierById) : null;
  },

  async create(payload: ReturPembelianInput): Promise<ReturPembelian> {
    if (!payload.items.length) {
      throw new Error("Minimal satu item obat wajib diisi");
    }

    const total = calculateTotal(payload.items);
    const status = payload.status ?? "draft";
    const cabangId = await resolveCabangId(payload.cabangId);
    const nomor = generateNomor(new Date(payload.tanggal || Date.now()));

    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const created: ReturPembelian = {
        id,
        cabangId,
        nomor,
        supplierId: payload.supplierId,
        namaSupplier: "-",
        pembelianId: payload.pembelianId,
        tanggal: payload.tanggal,
        alasan: payload.alasan,
        total,
        status,
        createdBy: "",
        createdAt: now,
        updatedAt: now,
        details: payload.items.map((item) => ({
          id: crypto.randomUUID(),
          returId: id,
          barangId: item.barangId,
          namaBarang: "-",
          batchId: item.batchId ?? undefined,
          jumlah: item.jumlah,
          hargaBeli: item.hargaBeli,
          subtotal: item.jumlah * item.hargaBeli
        }))
      };

      localRetur.unshift(created);
      return created;
    }

    const dibuatOleh = await resolvePenggunaId();

    const { data, error } = await supabase
      .from("retur_pembelian")
      .insert({
        cabang_id: cabangId,
        supplier_id: payload.supplierId,
        pembelian_id: payload.pembelianId || null,
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

    if (error) {
      throw new Error(error.message);
    }

    if (payload.items.length) {
      const { error: detailError } = await supabase.from("retur_pembelian_detail").insert(
        payload.items.map((item) => ({
          retur_pembelian_id: data.id,
          barang_id: item.barangId,
          batch_id: item.batchId || null,
          qty: item.jumlah,
          harga_beli: item.hargaBeli,
          subtotal: item.jumlah * item.hargaBeli
        }))
      );

      if (detailError) {
        throw new Error(detailError.message);
      }
    }

    const created = await this.getById(data.id);

    if (!created) {
      throw new Error("Retur berhasil dibuat, tetapi data tidak dapat dimuat ulang");
    }

    if (created.status === "posted") {
      await reduceStockForRetur(created);
    }

    return created;
  },

  async post(id: string) {
    const retur = await this.getById(id);

    if (!retur) {
      throw new Error("Retur tidak ditemukan");
    }

    if (retur.status === "posted") {
      return retur;
    }

    if (retur.status === "dibatalkan") {
      throw new Error("Retur yang sudah dibatalkan tidak bisa diposting");
    }

    if (!isSupabaseConfigured || !supabase) {
      const index = localRetur.findIndex((item) => item.id === id);
      if (index >= 0) {
        localRetur[index] = { ...localRetur[index], status: "posted", updatedAt: new Date().toISOString() };
      }

      return localRetur[index] ?? retur;
    }

    await reduceStockForRetur(retur);

    const { error } = await supabase
      .from("retur_pembelian")
      .update({ status: "posted", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const updated = await this.getById(id);
    return updated ?? { ...retur, status: "posted" as const };
  }
};
