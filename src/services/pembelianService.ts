import { defaultCabangId } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Pembelian, PembelianDetail, StatusPembelian } from "@/types";
import { getCurrentUserId, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface PembelianItemInput {
  barangId: string;
  batchNumber?: string;
  tanggalExpired?: string;
  satuanId?: string;
  jumlah: number;
  hargaBeli: number;
  diskonPersen?: number;
  diskonNominal?: number;
}

export interface PembelianInput {
  nomorFaktur?: string;
  nomorInternal?: string;
  cabangId?: string;
  suratPesananId?: string;
  supplierId: string;
  tanggalFaktur: string;
  tanggalJatuhTempo?: string;
  diskonTotal?: number;
  pajakTotal?: number;
  status?: StatusPembelian;
  catatan?: string;
  items: PembelianItemInput[];
}

interface FakturPembelianRow {
  id: string;
  cabang_id: string | null;
  supplier_id: string | null;
  surat_pesanan_id: string | null;
  nomor_faktur: string;
  nomor_internal: string;
  tanggal_faktur: string | null;
  tanggal_jatuh_tempo: string | null;
  subtotal: number | string | null;
  diskon_total: number | string | null;
  pajak_total: number | string | null;
  grand_total: number | string | null;
  status: StatusPembelian | null;
  catatan: string | null;
  dibuat_oleh: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface FakturPembelianDetailRow {
  id: string;
  faktur_pembelian_id: string | null;
  barang_id: string | null;
  batch_id: string | null;
  satuan_id: string | null;
  qty: number | null;
  harga_beli: number | string | null;
  diskon_persen: number | string | null;
  diskon_nominal: number | string | null;
  subtotal: number | string | null;
  harga_pokok: number | string | null;
}

interface BatchInfo {
  nomorBatch: string;
  tanggalExpired?: string;
}

const localPembelian: Pembelian[] = [];

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function generateNomorInternal(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(Date.now()).slice(-5);
  return `PBL-${stamp}-${suffix}`;
}

function calculateLineSubtotal(item: PembelianItemInput) {
  const gross = item.jumlah * item.hargaBeli;
  const diskonPersenAmount = gross * ((item.diskonPersen ?? 0) / 100);
  const diskonNominal = item.diskonNominal ?? 0;
  return Math.max(0, gross - diskonPersenAmount - diskonNominal);
}

function calculateTotals(payload: PembelianInput) {
  const subtotal = payload.items.reduce(
    (sum, item) => sum + calculateLineSubtotal(item),
    0
  );
  const diskonTotal = payload.diskonTotal ?? 0;
  const pajakTotal = payload.pajakTotal ?? 0;
  const grandTotal = Math.max(0, subtotal - diskonTotal + pajakTotal);

  return { subtotal, diskonTotal, pajakTotal, grandTotal };
}

function toDetail(
  row: FakturPembelianDetailRow,
  obatById: Record<string, string> = {},
  batchById: Record<string, BatchInfo> = {}
): PembelianDetail {
  const barangId = row.barang_id ?? "";
  const batchId = row.batch_id ?? undefined;
  const batch = batchId ? batchById[batchId] : undefined;

  return {
    id: row.id,
    pembelianId: row.faktur_pembelian_id ?? "",
    barangId,
    namaBarang: obatById[barangId] ?? "-",
    batchId,
    batchNumber: batch?.nomorBatch ?? "",
    tanggalExpired: batch?.tanggalExpired ?? "",
    satuanId: row.satuan_id ?? undefined,
    jumlah: Number(row.qty ?? 0),
    hargaBeli: toNumber(row.harga_beli),
    diskonPersen: toNumber(row.diskon_persen),
    diskonNominal: toNumber(row.diskon_nominal),
    subtotal: toNumber(row.subtotal),
    hargaPokok: toNumber(row.harga_pokok)
  };
}

function toPembelian(
  row: FakturPembelianRow,
  details: PembelianDetail[] = [],
  supplierById: Record<string, string> = {}
): Pembelian {
  const supplierId = row.supplier_id ?? "";

  return {
    id: row.id,
    cabangId: row.cabang_id ?? "",
    nomorFaktur: row.nomor_faktur,
    nomorInternal: row.nomor_internal,
    supplierId,
    namaSupplier: supplierById[supplierId] ?? "-",
    suratPesananId: row.surat_pesanan_id ?? undefined,
    tanggalFaktur: row.tanggal_faktur ?? "",
    tanggalJatuhTempo: row.tanggal_jatuh_tempo ?? undefined,
    subtotal: toNumber(row.subtotal),
    diskonTotal: toNumber(row.diskon_total),
    pajakTotal: toNumber(row.pajak_total),
    grandTotal: toNumber(row.grand_total),
    status: row.status ?? "draft",
    catatan: row.catatan ?? "",
    createdBy: row.dibuat_oleh ?? "",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    details
  };
}

function filterPembelian(rows: Pembelian[], search?: string) {
  return matchSearch(rows, search, ["nomorFaktur", "nomorInternal", "namaSupplier", "status"]);
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
    supplierById: Object.fromEntries(
      (supplierResult.data ?? []).map((item) => [item.id, item.nama])
    ),
    obatById: Object.fromEntries(
      (obatResult.data ?? []).map((item) => [item.id, item.nama])
    )
  };
}

async function loadBatchInfo(batchIds: string[]) {
  if (!supabase || !batchIds.length) {
    return {} as Record<string, BatchInfo>;
  }

  const { data, error } = await supabase
    .from("batch_barang")
    .select("id,nomor_batch,tanggal_expired")
    .in("id", [...new Set(batchIds)]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, BatchInfo>>((acc, row) => {
    acc[row.id] = {
      nomorBatch: row.nomor_batch,
      tanggalExpired: row.tanggal_expired ?? undefined
    };
    return acc;
  }, {});
}

async function loadDetailsForPembelian(ids: string[]) {
  if (!supabase || !ids.length) {
    return {} as Record<string, PembelianDetail[]>;
  }

  const [{ data, error }, lookupMaps] = await Promise.all([
    supabase.from("faktur_pembelian_detail").select("*").in("faktur_pembelian_id", ids),
    loadLookupMaps()
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as FakturPembelianDetailRow[];
  const batchById = await loadBatchInfo(
    rows.map((row) => row.batch_id).filter((id): id is string => Boolean(id))
  );

  return rows.reduce<Record<string, PembelianDetail[]>>((acc, row) => {
    const detail = toDetail(row, lookupMaps.obatById, batchById);
    acc[detail.pembelianId] = [...(acc[detail.pembelianId] ?? []), detail];
    return acc;
  }, {});
}

async function findOrCreateBatch(
  barangId: string,
  supplierId: string,
  nomorBatch: string,
  tanggalExpired?: string
) {
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
    .insert({
      barang_id: barangId,
      supplier_id: supplierId || null,
      nomor_batch: nomorBatch,
      tanggal_expired: tanggalExpired || null
    })
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return created.id as string;
}

async function resolveCabangId(preferred?: string): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    return preferred || defaultCabangId;
  }

  if (preferred) {
    const { data } = await supabase
      .from("cabang")
      .select("id")
      .eq("id", preferred)
      .maybeSingle();

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

  const { data } = await supabase
    .from("pengguna")
    .select("id")
    .eq("id", current)
    .maybeSingle();

  return data?.id ? (data.id as string) : null;
}

async function receiveStock(pembelian: Pembelian) {
  if (!isSupabaseConfigured || !supabase || !pembelian.details.length) {
    return;
  }

  const validDetails = pembelian.details.filter(
    (detail) => detail.barangId && detail.jumlah > 0
  );

  if (!validDetails.length) {
    return;
  }

  const cabangId = pembelian.cabangId || defaultCabangId;

  for (const detail of validDetails) {
    const batchId = detail.batchId ?? null;

    let saldoQuery = supabase
      .from("saldo_stok")
      .select("id,qty")
      .eq("cabang_id", cabangId)
      .eq("barang_id", detail.barangId);
    saldoQuery = batchId ? saldoQuery.eq("batch_id", batchId) : saldoQuery.is("batch_id", null);

    const { data: existingSaldo, error: findSaldoError } = await saldoQuery.maybeSingle();

    if (findSaldoError) {
      throw new Error(findSaldoError.message);
    }

    let saldoAkhir: number;

    if (existingSaldo) {
      saldoAkhir = Number(existingSaldo.qty ?? 0) + detail.jumlah;
      const { error: updateError } = await supabase
        .from("saldo_stok")
        .update({ qty: saldoAkhir, updated_at: new Date().toISOString() })
        .eq("id", existingSaldo.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      saldoAkhir = detail.jumlah;
      const { error: insertError } = await supabase.from("saldo_stok").insert({
        cabang_id: cabangId,
        barang_id: detail.barangId,
        batch_id: batchId,
        qty: saldoAkhir
      });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    const { error: kartuError } = await supabase.from("kartu_stok").insert({
      cabang_id: cabangId,
      barang_id: detail.barangId,
      batch_id: batchId,
      tipe_mutasi: "masuk",
      sumber_tabel: "faktur_pembelian",
      sumber_id: pembelian.id,
      qty_masuk: detail.jumlah,
      qty_keluar: 0,
      saldo_akhir: saldoAkhir,
      harga_pokok: detail.hargaBeli,
      keterangan: `Penerimaan faktur ${pembelian.nomorInternal}`
    });

    if (kartuError) {
      throw new Error(kartuError.message);
    }
  }
}

export const pembelianService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterPembelian(localPembelian, params.search), params);
    }

    const [{ data, error }, lookupMaps] = await Promise.all([
      supabase
        .from("faktur_pembelian")
        .select("*")
        .order("created_at", { ascending: false }),
      loadLookupMaps()
    ]);

    if (error) {
      throw new Error(error.message);
    }

    const detailByPembelian = await loadDetailsForPembelian(
      (data ?? []).map((item) => item.id)
    );

    const rows = filterPembelian(
      (data ?? []).map((item) =>
        toPembelian(item, detailByPembelian[item.id] ?? [], lookupMaps.supplierById)
      ),
      params.search
    );

    return paginate(rows, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return localPembelian.find((item) => item.id === id) ?? null;
    }

    const [{ data, error }, lookupMaps, detailByPembelian] = await Promise.all([
      supabase.from("faktur_pembelian").select("*").eq("id", id).single(),
      loadLookupMaps(),
      loadDetailsForPembelian([id])
    ]);

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data
      ? toPembelian(data, detailByPembelian[id] ?? [], lookupMaps.supplierById)
      : null;
  },

  async create(payload: PembelianInput): Promise<Pembelian> {
    const totals = calculateTotals(payload);
    const status = payload.status ?? "draft";
    const cabangId = await resolveCabangId(payload.cabangId);
    const dibuatOleh = await resolvePenggunaId();
    const nomorInternal =
      payload.nomorInternal?.trim() ||
      generateNomorInternal(new Date(payload.tanggalFaktur || Date.now()));
    const nomorFaktur = payload.nomorFaktur?.trim() || nomorInternal;

    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const created: Pembelian = {
        id,
        cabangId,
        nomorFaktur,
        nomorInternal,
        supplierId: payload.supplierId,
        namaSupplier: "-",
        tanggalFaktur: payload.tanggalFaktur,
        tanggalJatuhTempo: payload.tanggalJatuhTempo,
        subtotal: totals.subtotal,
        diskonTotal: totals.diskonTotal,
        pajakTotal: totals.pajakTotal,
        grandTotal: totals.grandTotal,
        status,
        catatan: payload.catatan ?? "",
        createdBy: "",
        createdAt: now,
        updatedAt: now,
        details: payload.items.map((item) => ({
          id: crypto.randomUUID(),
          pembelianId: id,
          barangId: item.barangId,
          namaBarang: "-",
          batchNumber: item.batchNumber ?? "",
          tanggalExpired: item.tanggalExpired ?? "",
          satuanId: item.satuanId,
          jumlah: item.jumlah,
          hargaBeli: item.hargaBeli,
          diskonPersen: item.diskonPersen ?? 0,
          diskonNominal: item.diskonNominal ?? 0,
          subtotal: calculateLineSubtotal(item),
          hargaPokok: item.hargaBeli
        }))
      };

      localPembelian.unshift(created);
      return created;
    }

    const { data, error } = await supabase
      .from("faktur_pembelian")
      .insert({
        cabang_id: cabangId,
        supplier_id: payload.supplierId,
        surat_pesanan_id: payload.suratPesananId || null,
        nomor_faktur: nomorFaktur,
        nomor_internal: nomorInternal,
        tanggal_faktur: payload.tanggalFaktur || null,
        tanggal_jatuh_tempo: payload.tanggalJatuhTempo || null,
        subtotal: totals.subtotal,
        diskon_total: totals.diskonTotal,
        pajak_total: totals.pajakTotal,
        grand_total: totals.grandTotal,
        status,
        catatan: payload.catatan ?? "",
        dibuat_oleh: dibuatOleh,
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (payload.items.length) {
      const detailRows = [];

      for (const [index, item] of payload.items.entries()) {
        const nomorBatch =
          item.batchNumber?.trim() ||
          `${nomorInternal}-${String(index + 1).padStart(2, "0")}`;
        const batchId = await findOrCreateBatch(
          item.barangId,
          payload.supplierId,
          nomorBatch,
          item.tanggalExpired
        );

        detailRows.push({
          faktur_pembelian_id: data.id,
          barang_id: item.barangId,
          batch_id: batchId,
          satuan_id: item.satuanId ?? null,
          qty: item.jumlah,
          harga_beli: item.hargaBeli,
          diskon_persen: item.diskonPersen ?? 0,
          diskon_nominal: item.diskonNominal ?? 0,
          pajak_persen: 0,
          pajak_nominal: 0,
          subtotal: calculateLineSubtotal(item),
          harga_pokok: item.hargaBeli
        });
      }

      const { error: detailError } = await supabase
        .from("faktur_pembelian_detail")
        .insert(detailRows);

      if (detailError) {
        throw new Error(detailError.message);
      }
    }

    const created = await this.getById(data.id);

    if (!created) {
      throw new Error(
        "Pembelian berhasil dibuat, tetapi data tidak dapat dimuat ulang"
      );
    }

    if (created.status === "diterima") {
      await receiveStock(created);
    }

    return created;
  },

  async receive(id: string) {
    const pembelian = await this.getById(id);

    if (!pembelian) {
      throw new Error("Pembelian tidak ditemukan");
    }

    if (pembelian.status === "diterima") {
      return pembelian;
    }

    if (pembelian.status === "dibatalkan") {
      throw new Error("Pembelian dibatalkan tidak bisa diterima");
    }

    if (!isSupabaseConfigured || !supabase) {
      const index = localPembelian.findIndex((item) => item.id === id);
      if (index >= 0) {
        localPembelian[index] = {
          ...localPembelian[index],
          status: "diterima",
          updatedAt: new Date().toISOString()
        };
      }

      return localPembelian[index] ?? pembelian;
    }

    await receiveStock(pembelian);

    const { error } = await supabase
      .from("faktur_pembelian")
      .update({
        status: "diterima",
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const updated = await this.getById(id);
    return updated ?? { ...pembelian, status: "diterima" as const };
  }
};
