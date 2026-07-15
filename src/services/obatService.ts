import { golonganObat as localGolonganObat, defaultCabangId } from "@/lib/mock-data";
import { resolveActivePrices, type ActivePrice } from "@/lib/pricing";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Obat } from "@/types";
import { paginate, type ListParams } from "./serviceUtils";

export interface ObatInput {
  kode: string;
  nama: string;
  namaGenerik?: string;
  kategoriId?: string;
  golonganId?: string;
  satuanDefaultId?: string;
  /** Only used to tag the initial batch_barang row's supplier_id when seeding stock. */
  supplierId?: string;
  hargaBeli?: number;
  hargaJual?: number;
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
  /** Branch used for the initial harga_barang/saldo_stok rows. Defaults to defaultCabangId. */
  cabangId?: string;
}

export type ObatListItem = Obat;

export interface MasterOption {
  id: string;
  label: string;
}

interface BarangRow {
  id: string;
  kode: string;
  nama: string;
  nama_generik: string | null;
  kategori_id: string | null;
  golongan_id: string | null;
  satuan_default_id: string | null;
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

const localObat: ObatListItem[] = [];

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
    nama: payload.nama,
    nama_generik: payload.namaGenerik ?? null,
    kategori_id: payload.kategoriId || null,
    golongan_id: payload.golonganId || null,
    satuan_default_id: payload.satuanDefaultId || null,
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
  hargaByBarang: Record<string, ActivePrice> = {}
): ObatListItem {
  const kategoriId = row.kategori_id ?? undefined;
  const golonganId = row.golongan_id ?? undefined;
  const satuanId = row.satuan_default_id ?? undefined;
  const golongan = golonganId ? golonganById[golonganId] : undefined;

  return {
    id: row.id,
    kode: row.kode,
    namaGenerik: row.nama_generik ?? undefined,
    nama: row.nama,
    kategoriId,
    kategoriNama: kategoriId ? kategoriById[kategoriId] : undefined,
    golonganId,
    golonganNama: golongan?.nama,
    satuanDefaultId: satuanId,
    satuanNama: satuanId ? satuanById[satuanId] : undefined,
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
    status: row.aktif ?? true,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? ""
  };
}

function filterObat(rows: ObatListItem[], search?: string) {
  if (!search) {
    return rows;
  }

  const normalized = search.toLowerCase();

  return rows.filter((item) =>
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
      satuanById: {} as Record<string, string>
    };
  }

  const [kategoriResult, golonganResult, satuanResult] = await Promise.all([
    supabase.from("kategori_barang").select("id,nama"),
    supabase.from("golongan_obat").select("id,nama,butuh_resep"),
    supabase.from("satuan").select("id,nama")
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

  return { kategoriById, golonganById, satuanById };
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
  hargaJual: number
) {
  if (!supabase) {
    return;
  }

  let query = supabase
    .from("harga_barang")
    .select("id")
    .eq("barang_id", barangId)
    .eq("tipe_harga", "jual")
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
    tipe_harga: "jual",
    harga_beli: hargaBeli,
    harga_jual: hargaJual,
    tanggal_mulai: new Date().toISOString().slice(0, 10),
    aktif: true
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export const obatService = {
  async list(params: ListParams = {}, cabangId?: string) {
    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterObat(localObat, params.search), params);
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
    const hargaByBarang = await resolveActivePrices(barangIds, cabangId);

    const rows = filterObat(
      (data ?? []).map((item) =>
        toObat(
          item,
          stockByBarang,
          lookupMaps.kategoriById,
          lookupMaps.golonganById,
          lookupMaps.satuanById,
          hargaByBarang
        )
      ),
      params.search
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

    return data
      ? toObat(
          data,
          stockMapFrom(saldoResult.data ?? []),
          lookupMaps.kategoriById,
          lookupMaps.golonganById,
          lookupMaps.satuanById,
          hargaByBarang
        )
      : null;
  },

  async create(payload: ObatInput): Promise<ObatListItem> {
    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const created: ObatListItem = {
        id: crypto.randomUUID(),
        kode: payload.kode,
        namaGenerik: payload.namaGenerik,
        nama: payload.nama,
        kategoriId: payload.kategoriId,
        golonganId: payload.golonganId,
        satuanDefaultId: payload.satuanDefaultId,
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
        status: payload.status ?? true,
        createdAt: now,
        updatedAt: now
      };
      localObat.unshift(created);
      return created;
    }

    const { data, error } = await supabase
      .from("barang")
      .insert(toObatRow(payload))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (payload.hargaBeli !== undefined || payload.hargaJual !== undefined) {
      await upsertHargaJual(
        data.id,
        payload.cabangId,
        payload.hargaBeli ?? 0,
        payload.hargaJual ?? 0
      );
    }

    const stokAwal = Number(payload.stokAwal ?? 0);

    if (stokAwal > 0) {
      const effectiveCabangId = payload.cabangId || defaultCabangId;
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

    const created = await this.getById(data.id, payload.cabangId);

    if (!created) {
      throw new Error("Obat berhasil dibuat, tetapi data tidak dapat dimuat ulang");
    }

    return created;
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
        nama: payload.nama,
        namaGenerik: payload.namaGenerik,
        kategoriId: payload.kategoriId,
        golonganId: payload.golonganId,
        satuanDefaultId: payload.satuanDefaultId,
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

    const { error: saldoError } = await supabase
      .from("saldo_stok")
      .delete()
      .eq("barang_id", id);

    if (saldoError) {
      throw new Error(saldoError.message);
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
  }
};
