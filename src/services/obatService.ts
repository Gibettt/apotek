import { golonganObat as localGolonganObat } from "@/lib/mock-data";
import { resolveActivePrices, type ActivePrice } from "@/lib/pricing";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { EceranObat, Obat } from "@/types";
import { paginate, type ListParams } from "./serviceUtils";

interface EceranInput {
  enabled: boolean;
  satuanEceranId?: string;
  isiPerSatuan?: number;
  hargaJual?: number;
}

export interface ObatInput {
  kode: string;
  barcodeDefault?: string;
  nama: string;
  namaGenerik?: string;
  kategoriId?: string;
  jenisId?: string;
  golonganId?: string;
  pabrikId?: string;
  satuanDefaultId?: string;
  satuanBeliId?: string;
  satuanJualId?: string;
  lokasiDefaultId?: string;
  /** Only used to tag the initial batch_barang row's supplier_id when seeding stock. */
  supplierId?: string;
  hargaBeli?: number;
  hargaJual?: number;
  eceran?: EceranInput;
  stokMinimum?: number;
  stokMaksimum?: number;
  gambarUrl?: string;
  komposisi?: string;
  indikasi?: string;
  aturanPakai?: string;
  perluBatch?: boolean;
  perluExpired?: boolean;
  status?: boolean;
  stokAwal?: number;
  batchNumber?: string;
  tanggalExpired?: string;
  /** Branch used for the initial harga_barang/saldo_stok rows. Defaults to the first active branch. */
  cabangId?: string;
}

export type ObatListItem = Obat;

/**
 * obatService.update() replaces every column, it doesn't merge - so a partial edit (e.g. price-only)
 * must carry every existing field forward or it silently nulls out kategori/satuan/etc. Build the full
 * payload from the current record and layer overrides on top.
 */
export function toObatUpdatePayload(
  record: ObatListItem,
  overrides: Partial<ObatInput> = {}
): ObatInput {
  return {
    kode: record.kode,
    barcodeDefault: record.barcodeDefault,
    nama: record.nama,
    namaGenerik: record.namaGenerik,
    kategoriId: record.kategoriId,
    jenisId: record.jenisId,
    golonganId: record.golonganId,
    pabrikId: record.pabrikId,
    satuanDefaultId: record.satuanDefaultId,
    satuanBeliId: record.satuanBeliId,
    satuanJualId: record.satuanJualId,
    lokasiDefaultId: record.lokasiDefaultId,
    hargaBeli: record.hargaAktif?.hargaBeli ?? 0,
    hargaJual: record.hargaAktif?.hargaJual ?? 0,
    eceran: record.eceran
      ? {
          enabled: true,
          satuanEceranId: record.eceran.satuanId,
          isiPerSatuan: record.eceran.isiPerSatuan,
          hargaJual: record.eceran.hargaJual
        }
      : undefined,
    stokMinimum: record.stokMinimum,
    stokMaksimum: record.stokMaksimum,
    gambarUrl: record.gambarUrl,
    komposisi: record.komposisi,
    indikasi: record.indikasi,
    aturanPakai: record.aturanPakai,
    perluBatch: record.perluBatch,
    perluExpired: record.perluExpired,
    status: record.status,
    ...overrides
  };
}

export interface MasterOption {
  id: string;
  label: string;
}

interface ObatListParams extends ListParams {
  kategoriId?: string;
}

interface BarangRow {
  id: string;
  kode: string;
  barcode_default: string | null;
  nama: string;
  nama_generik: string | null;
  kategori_id: string | null;
  jenis_id: string | null;
  golongan_id: string | null;
  pabrik_id: string | null;
  satuan_default_id: string | null;
  satuan_beli_id: string | null;
  satuan_jual_id: string | null;
  lokasi_default_id: string | null;
  stok_minimum: number | null;
  stok_maksimum: number | null;
  gambar_url: string | null;
  komposisi: string | null;
  indikasi: string | null;
  aturan_pakai: string | null;
  perlu_batch: boolean | null;
  perlu_expired: boolean | null;
  aktif: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SaldoStokRow {
  barang_id: string | null;
  qty: number | string | null;
}

type GolonganLookup = Record<string, { nama: string; butuhResep: boolean }>;
type EceranLookup = Record<string, EceranObat>;

const localObat: ObatListItem[] = [];

function toObatErrorMessage(error: { message?: string; code?: string }) {
  if (
    error.code === "23505" ||
    error.message?.includes("barang_kode_key") ||
    error.message?.includes("duplicate key")
  ) {
    return "Kode obat sudah digunakan. Pakai kode lain atau edit data obat yang sudah ada.";
  }

  return error.message ?? "Gagal menyimpan obat";
}

async function resolveCabangId(cabangId?: string) {
  if (cabangId || !supabase) {
    return cabangId;
  }

  const { data, error } = await supabase
    .from("cabang")
    .select("id")
    .eq("aktif", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Cabang aktif belum tersedia. Tambahkan cabang terlebih dahulu.");
  }

  return data.id as string;
}

const TRANSACTION_HISTORY_TABLES = [
  "faktur_pembelian_detail",
  "penjualan_detail",
  "retur_pembelian_detail",
  "stok_opname_detail",
  "mutasi_stok_detail",
  "surat_pesanan_detail",
  "resep_detail"
] as const;

async function assertNoTransactionHistory(barangId: string) {
  if (!supabase) {
    return;
  }

  const results = await Promise.all(
    TRANSACTION_HISTORY_TABLES.map((table) =>
      supabase!.from(table).select("id").eq("barang_id", barangId).limit(1)
    )
  );

  const hasHistory = results.some((result) => {
    if (result.error) {
      throw new Error(result.error.message);
    }
    return (result.data ?? []).length > 0;
  });

  if (hasHistory) {
    throw new Error(
      "Obat ini sudah memiliki riwayat transaksi (pembelian/penjualan/retur/opname/resep) dan tidak bisa dihapus permanen. Nonaktifkan obat ini lewat halaman edit sebagai gantinya."
    );
  }
}

async function cleanupCreatedObat(barangId: string) {
  if (!supabase) {
    return;
  }

  await supabase.from("kartu_stok").delete().eq("barang_id", barangId);
  await supabase.from("saldo_stok").delete().eq("barang_id", barangId);
  await supabase.from("harga_barang").delete().eq("barang_id", barangId);
  await supabase.from("batch_barang").delete().eq("barang_id", barangId);
  await supabase.from("barang").delete().eq("id", barangId);
}

function resolveMembutuhkanResepLocal(golonganId?: string) {
  if (!golonganId) {
    return false;
  }

  return (
    localGolonganObat.find((item) => item.id === golonganId)?.butuhResep ?? false
  );
}

function toObatRow(payload: ObatInput) {
  return {
    kode: payload.kode,
    barcode_default: payload.barcodeDefault || null,
    nama: payload.nama,
    nama_generik: payload.namaGenerik ?? null,
    kategori_id: payload.kategoriId || null,
    jenis_id: payload.jenisId || null,
    golongan_id: payload.golonganId || null,
    pabrik_id: payload.pabrikId || null,
    satuan_default_id: payload.satuanDefaultId || null,
    satuan_beli_id: payload.satuanBeliId || null,
    satuan_jual_id: payload.satuanJualId || null,
    lokasi_default_id: payload.lokasiDefaultId || null,
    komposisi: payload.komposisi ?? "",
    indikasi: payload.indikasi ?? "",
    aturan_pakai: payload.aturanPakai ?? "",
    gambar_url: payload.gambarUrl ?? "",
    stok_minimum: payload.stokMinimum ?? 0,
    stok_maksimum: payload.stokMaksimum ?? 0,
    perlu_batch: payload.perluBatch ?? true,
    perlu_expired: payload.perluExpired ?? true,
    aktif: payload.status ?? true,
    updated_at: new Date().toISOString()
  };
}

function stockMapFrom(rows: SaldoStokRow[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    if (!row.barang_id) {
      return acc;
    }

    acc[row.barang_id] = (acc[row.barang_id] ?? 0) + Number(row.qty ?? 0);
    return acc;
  }, {});
}

function toObat(
  row: BarangRow,
  stockByBarang: Record<string, number> = {},
  kategoriById: Record<string, string> = {},
  golonganById: GolonganLookup = {},
  satuanById: Record<string, string> = {},
  hargaByBarang: Record<string, ActivePrice> = {},
  eceranByBarang: EceranLookup = {},
  jenisById: Record<string, string> = {},
  pabrikById: Record<string, string> = {},
  lokasiById: Record<string, string> = {}
): ObatListItem {
  const kategoriId = row.kategori_id ?? undefined;
  const golonganId = row.golongan_id ?? undefined;
  const satuanId = row.satuan_default_id ?? undefined;
  const jenisId = row.jenis_id ?? undefined;
  const pabrikId = row.pabrik_id ?? undefined;
  const satuanBeliId = row.satuan_beli_id ?? undefined;
  const satuanJualId = row.satuan_jual_id ?? undefined;
  const lokasiDefaultId = row.lokasi_default_id ?? undefined;
  const golongan = golonganId ? golonganById[golonganId] : undefined;

  return {
    id: row.id,
    kode: row.kode,
    barcodeDefault: row.barcode_default ?? undefined,
    namaGenerik: row.nama_generik ?? undefined,
    nama: row.nama,
    kategoriId,
    kategoriNama: kategoriId ? kategoriById[kategoriId] : undefined,
    jenisId,
    jenisNama: jenisId ? jenisById[jenisId] : undefined,
    golonganId,
    golonganNama: golongan?.nama,
    pabrikId,
    pabrikNama: pabrikId ? pabrikById[pabrikId] : undefined,
    satuanDefaultId: satuanId,
    satuanNama: satuanId ? satuanById[satuanId] : undefined,
    satuanBeliId,
    satuanBeliNama: satuanBeliId ? satuanById[satuanBeliId] : undefined,
    satuanJualId,
    satuanJualNama: satuanJualId ? satuanById[satuanJualId] : undefined,
    lokasiDefaultId,
    lokasiDefaultNama: lokasiDefaultId ? lokasiById[lokasiDefaultId] : undefined,
    stokMinimum: row.stok_minimum ?? 0,
    stokMaksimum: row.stok_maksimum ?? 0,
    stokTersedia: stockByBarang[row.id] ?? 0,
    gambarUrl: row.gambar_url ?? undefined,
    komposisi: row.komposisi ?? undefined,
    indikasi: row.indikasi ?? undefined,
    aturanPakai: row.aturan_pakai ?? undefined,
    perluBatch: row.perlu_batch ?? true,
    perluExpired: row.perlu_expired ?? true,
    membutuhkanResep: golongan?.butuhResep ?? false,
    hargaAktif: hargaByBarang[row.id],
    eceran: eceranByBarang[row.id],
    status: row.aktif ?? true,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? ""
  };
}

function filterObat(rows: ObatListItem[], params: ObatListParams = {}) {
  const filteredByKategori = params.kategoriId
    ? rows.filter((item) => item.kategoriId === params.kategoriId)
    : rows;

  if (!params.search) {
    return filteredByKategori;
  }

  const normalized = params.search.toLowerCase();

  return filteredByKategori.filter((item) =>
    [item.kode, item.nama, item.satuanNama, item.golonganNama, item.kategoriNama].some(
      (value) => String(value ?? "").toLowerCase().includes(normalized)
    )
  );
}

async function loadLookupMaps() {
  if (!supabase) {
    return {
      kategoriById: {} as Record<string, string>,
      golonganById: {} as GolonganLookup,
      satuanById: {} as Record<string, string>,
      jenisById: {} as Record<string, string>,
      pabrikById: {} as Record<string, string>,
      lokasiById: {} as Record<string, string>
    };
  }

  const [kategoriResult, golonganResult, satuanResult, jenisResult, pabrikResult, lokasiResult] =
    await Promise.all([
      supabase.from("kategori_barang").select("id,nama"),
      supabase.from("golongan_obat").select("id,nama,butuh_resep"),
      supabase.from("satuan").select("id,nama"),
      supabase.from("jenis_barang").select("id,nama"),
      supabase.from("pabrik").select("id,nama"),
      supabase.from("lokasi_simpan").select("id,nama")
    ]);

  if (kategoriResult.error) {
    throw new Error(kategoriResult.error.message);
  }

  if (golonganResult.error) {
    throw new Error(golonganResult.error.message);
  }

  if (satuanResult.error) {
    throw new Error(satuanResult.error.message);
  }

  if (jenisResult.error) {
    throw new Error(jenisResult.error.message);
  }

  if (pabrikResult.error) {
    throw new Error(pabrikResult.error.message);
  }

  if (lokasiResult.error) {
    throw new Error(lokasiResult.error.message);
  }

  const jenisById = Object.fromEntries(
    (jenisResult.data ?? []).map((item) => [item.id, item.nama])
  );
  const pabrikById = Object.fromEntries(
    (pabrikResult.data ?? []).map((item) => [item.id, item.nama])
  );
  const lokasiById = Object.fromEntries(
    (lokasiResult.data ?? []).map((item) => [item.id, item.nama])
  );

  const kategoriById = Object.fromEntries(
    (kategoriResult.data ?? []).map((item) => [item.id, item.nama])
  );
  const golonganById: GolonganLookup = Object.fromEntries(
    (golonganResult.data ?? []).map((item) => [
      item.id,
      { nama: item.nama, butuhResep: item.butuh_resep ?? false }
    ])
  );
  const satuanById = Object.fromEntries(
    (satuanResult.data ?? []).map((item) => [item.id, item.nama])
  );

  return { kategoriById, golonganById, satuanById, jenisById, pabrikById, lokasiById };
}

async function loadEceranByBarang(
  barangIds: string[],
  satuanById: Record<string, string>,
  satuanDefaultByBarang: Record<string, string | undefined>,
  cabangId?: string
): Promise<EceranLookup> {
  if (!supabase || !barangIds.length) {
    return {};
  }

  const [konversiResult, hargaByBarang] = await Promise.all([
    supabase
      .from("konversi_satuan")
      .select("barang_id,satuan_dari_id,satuan_ke_id,nilai_konversi")
      .in("barang_id", [...new Set(barangIds)])
      .gt("nilai_konversi", 1),
    resolveActivePrices(barangIds, cabangId, "eceran")
  ]);

  if (konversiResult.error) {
    throw new Error(konversiResult.error.message);
  }

  return (konversiResult.data ?? []).reduce<EceranLookup>((acc, row) => {
    if (
      !row.barang_id ||
      !row.satuan_ke_id ||
      !row.satuan_dari_id ||
      acc[row.barang_id] ||
      row.satuan_dari_id !== satuanDefaultByBarang[row.barang_id]
    ) {
      return acc;
    }

    const isiPerSatuan = Number(row.nilai_konversi ?? 0);
    if (isiPerSatuan <= 1) {
      return acc;
    }

    const harga = hargaByBarang[row.barang_id];
    acc[row.barang_id] = {
      satuanId: row.satuan_ke_id,
      satuanNama: satuanById[row.satuan_ke_id],
      isiPerSatuan,
      hargaJual: harga?.hargaJual ?? 0,
      hargaBeli: harga?.hargaBeli ?? 0
    };
    return acc;
  }, {});
}

async function findOrCreateBatch(
  barangId: string,
  supplierId: string | undefined,
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

async function upsertHargaJual(
  barangId: string,
  cabangId: string | undefined,
  hargaBeli: number,
  hargaJual: number,
  tipeHarga = "jual"
) {
  if (!supabase) {
    return;
  }

  let query = supabase
    .from("harga_barang")
    .select("id")
    .eq("barang_id", barangId)
    .eq("tipe_harga", tipeHarga)
    .eq("aktif", true);

  query = cabangId ? query.eq("cabang_id", cabangId) : query.is("cabang_id", null);

  const { data: existing, error: findError } = await query.maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("harga_barang")
      .update({
        harga_beli: hargaBeli,
        harga_jual: hargaJual,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return;
  }

  const { error: insertError } = await supabase.from("harga_barang").insert({
    barang_id: barangId,
    cabang_id: cabangId || null,
    tipe_harga: tipeHarga,
    harga_beli: hargaBeli,
    harga_jual: hargaJual,
    tanggal_mulai: new Date().toISOString().slice(0, 10),
    aktif: true
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function syncEceranConfig(
  barangId: string,
  payload: ObatInput,
  cabangId?: string
) {
  if (payload.eceran === undefined) {
    return;
  }

  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  if (!payload.eceran.enabled) {
    const satuanEceranId = payload.eceran.satuanEceranId;
    if (payload.satuanDefaultId && satuanEceranId) {
      await supabase
        .from("konversi_satuan")
        .delete()
        .eq("barang_id", barangId)
        .eq("satuan_dari_id", payload.satuanDefaultId)
        .eq("satuan_ke_id", satuanEceranId);
    }

    await supabase
      .from("harga_barang")
      .update({ aktif: false, updated_at: new Date().toISOString() })
      .eq("barang_id", barangId)
      .eq("tipe_harga", "eceran");
    return;
  }

  if (
    !payload.satuanDefaultId ||
    !payload.eceran.satuanEceranId ||
    !payload.eceran.isiPerSatuan ||
    payload.eceran.isiPerSatuan <= 1
  ) {
    throw new Error("Satuan utama, satuan eceran, dan isi per satuan wajib diisi.");
  }

  if (payload.satuanDefaultId === payload.eceran.satuanEceranId) {
    throw new Error("Satuan eceran harus berbeda dari satuan utama.");
  }

  const { data: existing, error: findError } = await supabase
    .from("konversi_satuan")
    .select("id")
    .eq("barang_id", barangId)
    .eq("satuan_dari_id", payload.satuanDefaultId)
    .eq("satuan_ke_id", payload.eceran.satuanEceranId)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  const konversiPayload = {
    barang_id: barangId,
    satuan_dari_id: payload.satuanDefaultId,
    satuan_ke_id: payload.eceran.satuanEceranId,
    nilai_konversi: payload.eceran.isiPerSatuan,
    updated_at: new Date().toISOString()
  };

  const { error } = existing
    ? await supabase.from("konversi_satuan").update(konversiPayload).eq("id", existing.id)
    : await supabase.from("konversi_satuan").insert(konversiPayload);

  if (error) {
    throw new Error(error.message);
  }

  await upsertHargaJual(
    barangId,
    cabangId,
    (payload.hargaBeli ?? 0) / payload.eceran.isiPerSatuan,
    payload.eceran.hargaJual ?? 0,
    "eceran"
  );
}

export const obatService = {
  async list(params: ObatListParams = {}, cabangId?: string) {
    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterObat(localObat, params), params);
    }

    let saldoQuery = supabase.from("saldo_stok").select("barang_id,qty");
    if (cabangId) {
      saldoQuery = saldoQuery.eq("cabang_id", cabangId);
    }

    const [{ data, error }, saldoResult, lookupMaps] = await Promise.all([
      supabase.from("barang").select("*").order("created_at", { ascending: false }),
      saldoQuery,
      loadLookupMaps()
    ]);

    if (error) {
      throw new Error(error.message);
    }

    if (saldoResult.error) {
      throw new Error(saldoResult.error.message);
    }

    const stockByBarang = stockMapFrom(saldoResult.data ?? []);
    const barangIds = (data ?? []).map((item) => item.id);
    const satuanDefaultByBarang = Object.fromEntries(
      (data ?? []).map((item) => [item.id, item.satuan_default_id ?? undefined])
    );
    const [hargaByBarang, eceranByBarang] = await Promise.all([
      resolveActivePrices(barangIds, cabangId),
      loadEceranByBarang(
        barangIds,
        lookupMaps.satuanById,
        satuanDefaultByBarang,
        cabangId
      )
    ]);

    const rows = filterObat(
      (data ?? []).map((item) =>
        toObat(
          item,
          stockByBarang,
          lookupMaps.kategoriById,
          lookupMaps.golonganById,
          lookupMaps.satuanById,
          hargaByBarang,
          eceranByBarang,
          lookupMaps.jenisById,
          lookupMaps.pabrikById,
          lookupMaps.lokasiById
        )
      ),
      params
    );

    return paginate(rows, params);
  },

  async search(query: string) {
    const result = await this.list({ search: query, perPage: 30 });
    return result.data.filter((item) => item.status);
  },

  async getById(id: string, cabangId?: string) {
    if (!isSupabaseConfigured || !supabase) {
      return localObat.find((item) => item.id === id) ?? null;
    }

    let saldoQuery = supabase.from("saldo_stok").select("barang_id,qty").eq("barang_id", id);
    if (cabangId) {
      saldoQuery = saldoQuery.eq("cabang_id", cabangId);
    }

    const [{ data, error }, saldoResult, lookupMaps, hargaByBarang] = await Promise.all([
      supabase.from("barang").select("*").eq("id", id).single(),
      saldoQuery,
      loadLookupMaps(),
      resolveActivePrices([id], cabangId)
    ]);

    if (error) {
      throw new Error(error.message);
    }

    if (saldoResult.error) {
      throw new Error(saldoResult.error.message);
    }

    const eceranByBarang = await loadEceranByBarang(
      [id],
      lookupMaps.satuanById,
      { [id]: data?.satuan_default_id ?? undefined },
      cabangId
    );

    return data
      ? toObat(
          data,
          stockMapFrom(saldoResult.data ?? []),
          lookupMaps.kategoriById,
          lookupMaps.golonganById,
          lookupMaps.satuanById,
          hargaByBarang,
          eceranByBarang,
          lookupMaps.jenisById,
          lookupMaps.pabrikById,
          lookupMaps.lokasiById
        )
      : null;
  },

  async create(payload: ObatInput): Promise<ObatListItem> {
    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const created: ObatListItem = {
        id: crypto.randomUUID(),
        kode: payload.kode,
        barcodeDefault: payload.barcodeDefault,
        namaGenerik: payload.namaGenerik,
        nama: payload.nama,
        kategoriId: payload.kategoriId,
        jenisId: payload.jenisId,
        golonganId: payload.golonganId,
        pabrikId: payload.pabrikId,
        satuanDefaultId: payload.satuanDefaultId,
        satuanBeliId: payload.satuanBeliId,
        satuanJualId: payload.satuanJualId,
        lokasiDefaultId: payload.lokasiDefaultId,
        stokMinimum: payload.stokMinimum ?? 0,
        stokMaksimum: payload.stokMaksimum ?? 0,
        stokTersedia: payload.stokAwal ?? 0,
        gambarUrl: payload.gambarUrl,
        komposisi: payload.komposisi,
        indikasi: payload.indikasi,
        aturanPakai: payload.aturanPakai,
        perluBatch: payload.perluBatch ?? true,
        perluExpired: payload.perluExpired ?? true,
        membutuhkanResep: resolveMembutuhkanResepLocal(payload.golonganId),
        hargaAktif:
          payload.hargaBeli !== undefined || payload.hargaJual !== undefined
            ? { hargaBeli: payload.hargaBeli ?? 0, hargaJual: payload.hargaJual ?? 0 }
            : undefined,
        eceran:
          payload.eceran?.enabled && payload.eceran.satuanEceranId
            ? {
                satuanId: payload.eceran.satuanEceranId,
                isiPerSatuan: payload.eceran.isiPerSatuan ?? 1,
                hargaJual: payload.eceran.hargaJual ?? 0,
                hargaBeli:
                  (payload.hargaBeli ?? 0) / (payload.eceran.isiPerSatuan ?? 1)
              }
            : undefined,
        status: payload.status ?? true,
        createdAt: now,
        updatedAt: now
      };
      localObat.unshift(created);
      return created;
    }

    const effectiveCabangId = await resolveCabangId(payload.cabangId);

    const { data, error } = await supabase
      .from("barang")
      .insert(toObatRow(payload))
      .select("*")
      .single();

    if (error) {
      throw new Error(toObatErrorMessage(error));
    }

    try {
      if (payload.hargaBeli !== undefined || payload.hargaJual !== undefined) {
        await upsertHargaJual(
          data.id,
          effectiveCabangId,
          payload.hargaBeli ?? 0,
          payload.hargaJual ?? 0
        );
      }
      await syncEceranConfig(data.id, payload, effectiveCabangId);

      const stokAwal = Number(payload.stokAwal ?? 0);

      if (stokAwal > 0) {
        const nomorBatch = payload.batchNumber?.trim() || `AWAL-${data.kode}`;
        const batchId = await findOrCreateBatch(
          data.id,
          payload.supplierId,
          nomorBatch,
          payload.tanggalExpired
        );

        const { data: existingSaldo, error: findSaldoError } = await supabase
          .from("saldo_stok")
          .select("id,qty")
          .eq("cabang_id", effectiveCabangId)
          .eq("barang_id", data.id)
          .eq("batch_id", batchId)
          .maybeSingle();

        if (findSaldoError) {
          throw new Error(findSaldoError.message);
        }

        let saldoAkhir = stokAwal;

        if (existingSaldo) {
          saldoAkhir = Number(existingSaldo.qty ?? 0) + stokAwal;
          const { error: updateError } = await supabase
            .from("saldo_stok")
            .update({ qty: saldoAkhir, updated_at: new Date().toISOString() })
            .eq("id", existingSaldo.id);

          if (updateError) {
            throw new Error(updateError.message);
          }
        } else {
          const { error: insertSaldoError } = await supabase.from("saldo_stok").insert({
            cabang_id: effectiveCabangId,
            barang_id: data.id,
            batch_id: batchId,
            qty: stokAwal
          });

          if (insertSaldoError) {
            throw new Error(insertSaldoError.message);
          }
        }

        const { error: kartuError } = await supabase.from("kartu_stok").insert({
          cabang_id: effectiveCabangId,
          barang_id: data.id,
          batch_id: batchId,
          tipe_mutasi: "masuk",
          sumber_tabel: "barang",
          sumber_id: data.id,
          qty_masuk: stokAwal,
          qty_keluar: 0,
          saldo_akhir: saldoAkhir,
          harga_pokok: payload.hargaBeli ?? 0,
          keterangan: `Stok awal ${data.kode}`
        });

        if (kartuError) {
          throw new Error(kartuError.message);
        }
      }

      const created = await this.getById(data.id, effectiveCabangId);

      if (!created) {
        throw new Error("Obat berhasil dibuat, tetapi data tidak dapat dimuat ulang");
      }

      return created;
    } catch (createError) {
      await cleanupCreatedObat(data.id);
      throw createError;
    }
  },

  async update(id: string, payload: ObatInput): Promise<ObatListItem | null> {
    if (!isSupabaseConfigured || !supabase) {
      const index = localObat.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }

      localObat[index] = {
        ...localObat[index],
        kode: payload.kode,
        barcodeDefault: payload.barcodeDefault,
        nama: payload.nama,
        namaGenerik: payload.namaGenerik,
        kategoriId: payload.kategoriId,
        jenisId: payload.jenisId,
        golonganId: payload.golonganId,
        pabrikId: payload.pabrikId,
        satuanDefaultId: payload.satuanDefaultId,
        satuanBeliId: payload.satuanBeliId,
        satuanJualId: payload.satuanJualId,
        lokasiDefaultId: payload.lokasiDefaultId,
        stokMinimum: payload.stokMinimum ?? 0,
        stokMaksimum: payload.stokMaksimum ?? 0,
        gambarUrl: payload.gambarUrl,
        komposisi: payload.komposisi,
        indikasi: payload.indikasi,
        aturanPakai: payload.aturanPakai,
        perluBatch: payload.perluBatch ?? true,
        perluExpired: payload.perluExpired ?? true,
        membutuhkanResep: resolveMembutuhkanResepLocal(payload.golonganId),
        hargaAktif:
          payload.hargaBeli !== undefined || payload.hargaJual !== undefined
            ? { hargaBeli: payload.hargaBeli ?? 0, hargaJual: payload.hargaJual ?? 0 }
            : localObat[index].hargaAktif,
        eceran:
          payload.eceran === undefined
            ? localObat[index].eceran
            : payload.eceran.enabled && payload.eceran.satuanEceranId
              ? {
                  satuanId: payload.eceran.satuanEceranId,
                  isiPerSatuan: payload.eceran.isiPerSatuan ?? 1,
                  hargaJual: payload.eceran.hargaJual ?? 0,
                  hargaBeli:
                    (payload.hargaBeli ?? 0) / (payload.eceran.isiPerSatuan ?? 1)
                }
              : undefined,
        status: payload.status ?? true,
        updatedAt: new Date().toISOString()
      };

      return localObat[index];
    }

    const { data, error } = await supabase
      .from("barang")
      .update(toObatRow(payload))
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (payload.hargaBeli !== undefined || payload.hargaJual !== undefined) {
      await upsertHargaJual(
        id,
        payload.cabangId,
        payload.hargaBeli ?? 0,
        payload.hargaJual ?? 0
      );
    }
    await syncEceranConfig(id, payload, payload.cabangId);

    return this.getById(data.id, payload.cabangId);
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      const index = localObat.findIndex((item) => item.id === id);
      if (index >= 0) {
        localObat.splice(index, 1);
      }

      return { id, success: true };
    }

    await assertNoTransactionHistory(id);

    const { error: kartuError } = await supabase
      .from("kartu_stok")
      .delete()
      .eq("barang_id", id);

    if (kartuError) {
      throw new Error(kartuError.message);
    }

    const { error: saldoError } = await supabase
      .from("saldo_stok")
      .delete()
      .eq("barang_id", id);

    if (saldoError) {
      throw new Error(saldoError.message);
    }

    const { error: hargaError } = await supabase
      .from("harga_barang")
      .delete()
      .eq("barang_id", id);

    if (hargaError) {
      throw new Error(hargaError.message);
    }

    const { error: konversiError } = await supabase
      .from("konversi_satuan")
      .delete()
      .eq("barang_id", id);

    if (konversiError) {
      throw new Error(konversiError.message);
    }

    const { error: barcodeError } = await supabase
      .from("barcode_barang")
      .delete()
      .eq("barang_id", id);

    if (barcodeError) {
      throw new Error(barcodeError.message);
    }

    const { error: batchError } = await supabase
      .from("batch_barang")
      .delete()
      .eq("barang_id", id);

    if (batchError) {
      throw new Error(batchError.message);
    }

    const { error } = await supabase.from("barang").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  },

  async listKategoriOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("kategori_barang")
      .select("id,nama")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  },

  async listGolonganOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("golongan_obat")
      .select("id,nama")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  },

  async listSatuanOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("satuan")
      .select("id,nama")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  },

  async listSupplierOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("supplier")
      .select("id,nama")
      .eq("aktif", true)
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  },

  async listJenisOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("jenis_barang")
      .select("id,nama")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  },

  async listPabrikOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("pabrik")
      .select("id,nama")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  },

  async listLokasiOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("lokasi_simpan")
      .select("id,nama")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  }
};
