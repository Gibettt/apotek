import { defaultCabangId, obat as localObat, stokBatches as localStokBatches, stokMutasi as localStokMutasi } from "@/lib/mock-data";
import { isLowStock, LOW_STOCK_THRESHOLD } from "@/lib/stockRules";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { StokBatch, StokMutasi, TipeMutasi } from "@/types";
import { delay, getCurrentUserId, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface LowStockItem {
  id: string;
  nama: string;
  stokMinimum: number;
  stokTersedia: number;
}

export interface StokMasukInput {
  barangId: string;
  cabangId?: string;
  qty: number;
  nomorBatch?: string;
  tanggalExpired?: string;
  hargaBeli?: number;
  keterangan?: string;
}

export interface StokKeluarInput {
  barangId: string;
  cabangId?: string;
  qty: number;
  keterangan: string;
}

export interface StokOpnameInput {
  barangId: string;
  cabangId?: string;
  stokFisik: number;
  keterangan?: string;
}

export interface StokBatchOption {
  batchId: string | null;
  nomorBatch: string;
  qty: number;
}

export interface ExpiringBatch {
  id: string;
  barangId: string;
  namaBarang: string;
  nomorBatch: string;
  tanggalExpired: string;
  qty: number;
}

function firstOf<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
}

interface SaldoStokRow {
  id: string;
  cabang_id: string;
  barang_id: string;
  batch_id: string | null;
  lokasi_simpan_id: string | null;
  qty: number | string | null;
  updated_at: string | null;
  barang?: { nama: string } | { nama: string }[] | null;
  batch_barang?:
    | { nomor_batch: string; tanggal_expired: string | null }
    | { nomor_batch: string; tanggal_expired: string | null }[]
    | null;
  lokasi_simpan?: { nama: string } | { nama: string }[] | null;
}

interface KartuStokRow {
  id: string;
  cabang_id: string;
  barang_id: string;
  batch_id: string | null;
  tipe_mutasi: TipeMutasi;
  qty_masuk: number | string | null;
  qty_keluar: number | string | null;
  saldo_akhir: number | string | null;
  harga_pokok: number | string | null;
  sumber_tabel: string | null;
  sumber_id: string | null;
  keterangan: string | null;
  dibuat_oleh: string | null;
  created_at: string | null;
  barang?: { nama: string } | { nama: string }[] | null;
}

function toStokBatch(row: SaldoStokRow): StokBatch {
  const barang = firstOf(row.barang);
  const batch = firstOf(row.batch_barang);
  const lokasi = firstOf(row.lokasi_simpan);

  return {
    id: row.id,
    barangId: row.barang_id,
    namaBarang: barang?.nama ?? "-",
    nomorBatch: batch?.nomor_batch ?? "-",
    tanggalExpired: batch?.tanggal_expired ?? undefined,
    qty: Number(row.qty ?? 0),
    cabangId: row.cabang_id,
    lokasiSimpanId: row.lokasi_simpan_id ?? undefined,
    lokasiNama: lokasi?.nama,
    createdAt: row.updated_at ?? "",
    updatedAt: row.updated_at ?? ""
  };
}

function toStokMutasi(row: KartuStokRow): StokMutasi {
  const barang = firstOf(row.barang);

  return {
    id: row.id,
    cabangId: row.cabang_id,
    barangId: row.barang_id,
    namaBarang: barang?.nama ?? "-",
    batchId: row.batch_id ?? undefined,
    tipeMutasi: row.tipe_mutasi,
    qtyMasuk: Number(row.qty_masuk ?? 0),
    qtyKeluar: Number(row.qty_keluar ?? 0),
    saldoAkhir: Number(row.saldo_akhir ?? 0),
    hargaPokok: Number(row.harga_pokok ?? 0),
    sumberTabel: row.sumber_tabel ?? undefined,
    sumberId: row.sumber_id ?? undefined,
    keterangan: row.keterangan ?? undefined,
    createdBy: row.dibuat_oleh ?? undefined,
    createdAt: row.created_at ?? ""
  };
}

function filterStokBatch(rows: StokBatch[], search?: string) {
  return matchSearch(rows, search, ["namaBarang", "nomorBatch", "lokasiNama"]);
}

function filterStokMutasi(rows: StokMutasi[], search?: string) {
  return matchSearch(rows, search, ["namaBarang", "keterangan"]);
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

async function findOrCreateBatch(barangId: string, nomorBatch: string, tanggalExpired?: string) {
  if (!supabase) {
    return null;
  }

  const { data: existing, error: findError } = await supabase
    .from("batch_barang")
    .select("id")
    .eq("barang_id", barangId)
    .eq("nomor_batch", nomorBatch)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (existing) {
    return existing.id as string;
  }

  const { data: created, error: createError } = await supabase
    .from("batch_barang")
    .insert({ barang_id: barangId, nomor_batch: nomorBatch, tanggal_expired: tanggalExpired || null })
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return created.id as string;
}

/** Adjustment bucket for stock that isn't tied to a specific batch (opname deltas, corrections without a batch number). */
async function findOrCreateAdjustmentSaldo(cabangId: string, barangId: string) {
  if (!supabase) {
    return null;
  }

  const { data: existing, error: findError } = await supabase
    .from("saldo_stok")
    .select("id,qty")
    .eq("cabang_id", cabangId)
    .eq("barang_id", barangId)
    .is("batch_id", null)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (existing) {
    return { id: existing.id as string, qty: Number(existing.qty ?? 0) };
  }

  const { data: created, error: createError } = await supabase
    .from("saldo_stok")
    .insert({ cabang_id: cabangId, barang_id: barangId, batch_id: null, qty: 0 })
    .select("id,qty")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return { id: created.id as string, qty: Number(created.qty ?? 0) };
}

export const stokService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterStokBatch(localStokBatches, params.search), params));
    }

    const { data, error } = await supabase
      .from("saldo_stok")
      .select(
        "id,cabang_id,barang_id,batch_id,lokasi_simpan_id,qty,updated_at,barang(nama),batch_barang(nomor_batch,tanggal_expired),lokasi_simpan(nama)"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterStokBatch((data ?? []).map(toStokBatch), params.search);
    return paginate(rows, params);
  },

  async lowStock(): Promise<LowStockItem[]> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(
        localObat
          .filter((item) => isLowStock(item.stokTersedia))
          .map((item) => ({
            id: item.id,
            nama: item.nama,
            stokMinimum: LOW_STOCK_THRESHOLD,
            stokTersedia: item.stokTersedia
          }))
      );
    }

    const [barangResult, saldoResult] = await Promise.all([
      supabase.from("barang").select("id,nama,stok_minimum").eq("aktif", true),
      supabase.from("saldo_stok").select("barang_id,qty")
    ]);

    if (barangResult.error) {
      throw new Error(barangResult.error.message);
    }

    if (saldoResult.error) {
      throw new Error(saldoResult.error.message);
    }

    const qtyByBarang = (saldoResult.data ?? []).reduce<Record<string, number>>((acc, row) => {
      if (!row.barang_id) {
        return acc;
      }

      acc[row.barang_id] = (acc[row.barang_id] ?? 0) + Number(row.qty ?? 0);
      return acc;
    }, {});

    return (barangResult.data ?? [])
      .map((item) => ({
        id: item.id as string,
        nama: item.nama as string,
        stokMinimum: LOW_STOCK_THRESHOLD,
        stokTersedia: qtyByBarang[item.id] ?? 0
      }))
      .filter((item) => isLowStock(item.stokTersedia));
  },

  async expiredSoon(days = 60): Promise<ExpiringBatch[]> {
    if (!isSupabaseConfigured || !supabase) {
      const limit = new Date();
      limit.setDate(limit.getDate() + days);

      return delay(
        localStokBatches
          .filter((item) => item.tanggalExpired && new Date(item.tanggalExpired) <= limit)
          .map((item) => ({
            id: item.id,
            barangId: item.barangId,
            namaBarang: item.namaBarang,
            nomorBatch: item.nomorBatch,
            tanggalExpired: item.tanggalExpired ?? "",
            qty: item.qty
          }))
      );
    }

    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const limitDate = limit.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("batch_barang")
      .select("id,barang_id,nomor_batch,tanggal_expired,barang(nama),saldo_stok(qty)")
      .not("tanggal_expired", "is", null)
      .lte("tanggal_expired", limitDate)
      .order("tanggal_expired", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => {
      const barang = firstOf(row.barang as { nama: string } | { nama: string }[] | null);
      const saldoRows = Array.isArray(row.saldo_stok)
        ? (row.saldo_stok as { qty: number | string | null }[])
        : row.saldo_stok
          ? [row.saldo_stok as { qty: number | string | null }]
          : [];
      const qty = saldoRows.reduce((sum, item) => sum + Number(item.qty ?? 0), 0);

      return {
        id: row.id as string,
        barangId: row.barang_id as string,
        namaBarang: barang?.nama ?? "-",
        nomorBatch: row.nomor_batch as string,
        tanggalExpired: (row.tanggal_expired as string) ?? "",
        qty
      };
    });
  },

  async mutations(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterStokMutasi(localStokMutasi, params.search), params));
    }

    const { data, error } = await supabase
      .from("kartu_stok")
      .select("*,barang(nama)")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterStokMutasi((data ?? []).map(toStokMutasi), params.search);
    return paginate(rows, params);
  },

  /** Batches with stock on hand for one barang, for pickers like the retur pembelian form. */
  async batchesForBarang(barangId: string, cabangId?: string): Promise<StokBatchOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStokBatches
        .filter((item) => item.barangId === barangId && item.qty > 0)
        .map((item) => ({ batchId: item.id, nomorBatch: item.nomorBatch, qty: item.qty }));
    }

    let query = supabase
      .from("saldo_stok")
      .select("batch_id,qty,batch_barang(nomor_batch)")
      .eq("barang_id", barangId)
      .gt("qty", 0);

    if (cabangId) {
      query = query.eq("cabang_id", cabangId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => {
      const batch = firstOf(row.batch_barang as { nomor_batch: string } | { nomor_batch: string }[] | null);
      return {
        batchId: (row.batch_id as string | null) ?? null,
        nomorBatch: batch?.nomor_batch ?? "Tanpa batch",
        qty: Number(row.qty ?? 0)
      };
    });
  },

  async masuk(payload: StokMasukInput) {
    if (payload.qty <= 0) {
      throw new Error("Jumlah stok masuk harus lebih besar dari nol");
    }

    const cabangId = await resolveCabangId(payload.cabangId);
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const nomorBatch = payload.nomorBatch?.trim() || "PENYESUAIAN";
      const existing = localStokBatches.find(
        (item) => item.barangId === payload.barangId && item.nomorBatch === nomorBatch
      );

      if (existing) {
        existing.qty += payload.qty;
        existing.updatedAt = now;
      } else {
        localStokBatches.unshift({
          id: crypto.randomUUID(),
          barangId: payload.barangId,
          namaBarang: localObat.find((item) => item.id === payload.barangId)?.nama ?? "-",
          nomorBatch,
          tanggalExpired: payload.tanggalExpired,
          qty: payload.qty,
          cabangId,
          createdAt: now,
          updatedAt: now
        });
      }

      localStokMutasi.unshift({
        id: crypto.randomUUID(),
        cabangId,
        barangId: payload.barangId,
        namaBarang: localObat.find((item) => item.id === payload.barangId)?.nama ?? "-",
        tipeMutasi: "masuk",
        qtyMasuk: payload.qty,
        qtyKeluar: 0,
        saldoAkhir: existing ? existing.qty : payload.qty,
        hargaPokok: payload.hargaBeli ?? 0,
        sumberTabel: "stok_manual",
        keterangan: payload.keterangan || "Stok masuk manual",
        createdAt: now
      });

      return { success: true };
    }

    const dibuatOleh = await resolvePenggunaId();
    const batchId = payload.nomorBatch?.trim()
      ? await findOrCreateBatch(payload.barangId, payload.nomorBatch.trim(), payload.tanggalExpired)
      : null;

    let saldoQuery = supabase
      .from("saldo_stok")
      .select("id,qty")
      .eq("cabang_id", cabangId)
      .eq("barang_id", payload.barangId);
    saldoQuery = batchId ? saldoQuery.eq("batch_id", batchId) : saldoQuery.is("batch_id", null);
    const { data: existingSaldo, error: findSaldoError } = await saldoQuery.maybeSingle();

    if (findSaldoError) {
      throw new Error(findSaldoError.message);
    }

    let saldoAkhir: number;

    if (existingSaldo) {
      saldoAkhir = Number(existingSaldo.qty ?? 0) + payload.qty;
      const { error: updateError } = await supabase
        .from("saldo_stok")
        .update({ qty: saldoAkhir, updated_at: now })
        .eq("id", existingSaldo.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      saldoAkhir = payload.qty;
      const { error: insertError } = await supabase.from("saldo_stok").insert({
        cabang_id: cabangId,
        barang_id: payload.barangId,
        batch_id: batchId,
        qty: saldoAkhir
      });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    const { error: kartuError } = await supabase.from("kartu_stok").insert({
      cabang_id: cabangId,
      barang_id: payload.barangId,
      batch_id: batchId,
      tipe_mutasi: "masuk",
      sumber_tabel: "stok_manual",
      qty_masuk: payload.qty,
      qty_keluar: 0,
      saldo_akhir: saldoAkhir,
      harga_pokok: payload.hargaBeli ?? 0,
      keterangan: payload.keterangan || "Stok masuk manual",
      dibuat_oleh: dibuatOleh
    });

    if (kartuError) {
      throw new Error(kartuError.message);
    }

    return { success: true };
  },

  async keluar(payload: StokKeluarInput) {
    if (payload.qty <= 0) {
      throw new Error("Jumlah stok keluar harus lebih besar dari nol");
    }

    if (!payload.keterangan?.trim()) {
      throw new Error("Keterangan/alasan stok keluar wajib diisi");
    }

    const cabangId = await resolveCabangId(payload.cabangId);
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const batches = localStokBatches
        .filter((item) => item.barangId === payload.barangId && item.qty > 0)
        .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
      const available = batches.reduce((sum, item) => sum + item.qty, 0);

      if (payload.qty > available) {
        throw new Error(`Stok tidak mencukupi. Tersedia ${available}, diminta ${payload.qty}.`);
      }

      let remaining = payload.qty;
      for (const batch of batches) {
        if (remaining <= 0) break;
        const take = Math.min(batch.qty, remaining);
        batch.qty -= take;
        batch.updatedAt = now;
        remaining -= take;
      }

      localStokMutasi.unshift({
        id: crypto.randomUUID(),
        cabangId,
        barangId: payload.barangId,
        namaBarang: localObat.find((item) => item.id === payload.barangId)?.nama ?? "-",
        tipeMutasi: "keluar",
        qtyMasuk: 0,
        qtyKeluar: payload.qty,
        saldoAkhir: available - payload.qty,
        hargaPokok: 0,
        sumberTabel: "stok_manual",
        keterangan: payload.keterangan,
        createdAt: now
      });

      return { success: true };
    }

    const dibuatOleh = await resolvePenggunaId();

    const { data: rows, error } = await supabase
      .from("saldo_stok")
      .select("id,qty,batch_id")
      .eq("cabang_id", cabangId)
      .eq("barang_id", payload.barangId)
      .gt("qty", 0)
      .order("updated_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const available = (rows ?? []).reduce((sum, row) => sum + Number(row.qty ?? 0), 0);

    if (payload.qty > available) {
      throw new Error(`Stok tidak mencukupi. Tersedia ${available}, diminta ${payload.qty}.`);
    }

    let remaining = payload.qty;

    for (const row of rows ?? []) {
      if (remaining <= 0) break;

      const take = Math.min(Number(row.qty ?? 0), remaining);
      if (take <= 0) continue;

      const saldoAkhir = Number(row.qty ?? 0) - take;
      const { error: updateError } = await supabase
        .from("saldo_stok")
        .update({ qty: saldoAkhir, updated_at: now })
        .eq("id", row.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const { error: kartuError } = await supabase.from("kartu_stok").insert({
        cabang_id: cabangId,
        barang_id: payload.barangId,
        batch_id: row.batch_id ?? null,
        tipe_mutasi: "keluar",
        sumber_tabel: "stok_manual",
        qty_masuk: 0,
        qty_keluar: take,
        saldo_akhir: saldoAkhir,
        harga_pokok: 0,
        keterangan: payload.keterangan,
        dibuat_oleh: dibuatOleh
      });

      if (kartuError) {
        throw new Error(kartuError.message);
      }

      remaining -= take;
    }

    return { success: true };
  },

  async opname(payload: StokOpnameInput) {
    if (payload.stokFisik < 0) {
      throw new Error("Stok fisik tidak boleh negatif");
    }

    const cabangId = await resolveCabangId(payload.cabangId);
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const batches = localStokBatches.filter((item) => item.barangId === payload.barangId);
      const stokSistem = batches.reduce((sum, item) => sum + item.qty, 0);
      const selisih = payload.stokFisik - stokSistem;

      if (selisih === 0) {
        return { success: true, selisih: 0 };
      }

      let adjustment = localStokBatches.find(
        (item) => item.barangId === payload.barangId && item.nomorBatch === "PENYESUAIAN"
      );

      if (!adjustment) {
        adjustment = {
          id: crypto.randomUUID(),
          barangId: payload.barangId,
          namaBarang: localObat.find((item) => item.id === payload.barangId)?.nama ?? "-",
          nomorBatch: "PENYESUAIAN",
          qty: 0,
          cabangId,
          createdAt: now,
          updatedAt: now
        };
        localStokBatches.unshift(adjustment);
      }

      adjustment.qty += selisih;
      adjustment.updatedAt = now;

      localStokMutasi.unshift({
        id: crypto.randomUUID(),
        cabangId,
        barangId: payload.barangId,
        namaBarang: adjustment.namaBarang,
        tipeMutasi: "opname",
        qtyMasuk: selisih > 0 ? selisih : 0,
        qtyKeluar: selisih < 0 ? Math.abs(selisih) : 0,
        saldoAkhir: payload.stokFisik,
        hargaPokok: 0,
        sumberTabel: "stok_opname_manual",
        keterangan: payload.keterangan || `Opname: sistem ${stokSistem}, fisik ${payload.stokFisik}`,
        createdAt: now
      });

      return { success: true, selisih };
    }

    const dibuatOleh = await resolvePenggunaId();

    const { data: saldoRows, error: saldoError } = await supabase
      .from("saldo_stok")
      .select("qty")
      .eq("cabang_id", cabangId)
      .eq("barang_id", payload.barangId);

    if (saldoError) {
      throw new Error(saldoError.message);
    }

    const stokSistem = (saldoRows ?? []).reduce((sum, row) => sum + Number(row.qty ?? 0), 0);
    const selisih = payload.stokFisik - stokSistem;

    if (selisih === 0) {
      return { success: true, selisih: 0 };
    }

    const adjustment = await findOrCreateAdjustmentSaldo(cabangId, payload.barangId);

    if (!adjustment) {
      throw new Error("Gagal menyiapkan baris penyesuaian stok");
    }

    const { error: updateError } = await supabase
      .from("saldo_stok")
      .update({ qty: adjustment.qty + selisih, updated_at: now })
      .eq("id", adjustment.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const { error: kartuError } = await supabase.from("kartu_stok").insert({
      cabang_id: cabangId,
      barang_id: payload.barangId,
      batch_id: null,
      tipe_mutasi: "opname",
      sumber_tabel: "stok_opname_manual",
      qty_masuk: selisih > 0 ? selisih : 0,
      qty_keluar: selisih < 0 ? Math.abs(selisih) : 0,
      saldo_akhir: payload.stokFisik,
      harga_pokok: 0,
      keterangan: payload.keterangan || `Opname: sistem ${stokSistem}, fisik ${payload.stokFisik}`,
      dibuat_oleh: dibuatOleh
    });

    if (kartuError) {
      throw new Error(kartuError.message);
    }

    return { success: true, selisih };
  }
};
