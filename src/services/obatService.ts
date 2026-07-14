import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Obat, ObatGolongan } from "@/types";
import { paginate, type ListParams } from "./serviceUtils";

export interface ObatInput {
  kodeObat: string;
  namaObat: string;
  kategoriId?: number;
  supplierId?: number;
  satuan?: string;
  hargaBeli?: number;
  hargaJual?: number;
  stokMinimum?: number;
  gambarUrl?: string;
  deskripsi?: string;
  golongan?: ObatGolongan;
  membutuhkanResep?: boolean;
  status?: boolean;
  stokAwal?: number;
  batchNumber?: string;
  tanggalExpired?: string;
  lokasi?: string;
}

export interface ObatListItem extends Obat {
  kategoriNama?: string;
  supplierNama?: string;
}

export interface MasterOption {
  id: number;
  label: string;
}

interface ObatRow {
  id: number;
  kode_obat: string;
  nama_obat: string;
  kategori_id: number | null;
  supplier_id: number | null;
  satuan: string | null;
  harga_beli: number | string | null;
  harga_jual: number | string | null;
  stok_minimum: number | null;
  gambar_url: string | null;
  deskripsi: string | null;
  golongan: ObatGolongan | null;
  membutuhkan_resep: boolean | null;
  status: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface StokRow {
  obat_id: number | null;
  jumlah: number | null;
}

const localObat: ObatListItem[] = [];

function toObatRow(payload: ObatInput) {
  return {
    kode_obat: payload.kodeObat,
    nama_obat: payload.namaObat,
    kategori_id: payload.kategoriId || null,
    supplier_id: payload.supplierId || null,
    satuan: payload.satuan ?? "",
    harga_beli: payload.hargaBeli ?? 0,
    harga_jual: payload.hargaJual ?? 0,
    stok_minimum: payload.stokMinimum ?? 0,
    gambar_url: payload.gambarUrl ?? "",
    deskripsi: payload.deskripsi ?? "",
    golongan: payload.golongan ?? "bebas",
    membutuhkan_resep: payload.membutuhkanResep ?? false,
    status: payload.status ?? true,
    updated_at: new Date().toISOString()
  };
}

function stockMapFrom(rows: StokRow[]) {
  return rows.reduce<Record<number, number>>((acc, row) => {
    if (!row.obat_id) {
      return acc;
    }

    acc[row.obat_id] = (acc[row.obat_id] ?? 0) + Number(row.jumlah ?? 0);
    return acc;
  }, {});
}

function toObat(
  row: ObatRow,
  stockByObat: Record<number, number> = {},
  kategoriById: Record<number, string> = {},
  supplierById: Record<number, string> = {}
): ObatListItem {
  const kategoriId = row.kategori_id ?? 0;
  const supplierId = row.supplier_id ?? 0;

  return {
    id: row.id,
    kodeObat: row.kode_obat,
    namaObat: row.nama_obat,
    kategoriId,
    supplierId,
    satuan: row.satuan ?? "",
    hargaBeli: Number(row.harga_beli ?? 0),
    hargaJual: Number(row.harga_jual ?? 0),
    stokMinimum: row.stok_minimum ?? 0,
    stokTersedia: stockByObat[row.id] ?? 0,
    gambarUrl: row.gambar_url ?? "",
    deskripsi: row.deskripsi ?? "",
    golongan: row.golongan ?? "bebas",
    membutuhkanResep: row.membutuhkan_resep ?? false,
    status: row.status ?? true,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    kategoriNama: kategoriById[kategoriId],
    supplierNama: supplierById[supplierId]
  };
}

function filterObat(rows: ObatListItem[], search?: string) {
  if (!search) {
    return rows;
  }

  const normalized = search.toLowerCase();

  return rows.filter((item) =>
    [
      item.kodeObat,
      item.namaObat,
      item.satuan,
      item.golongan,
      item.kategoriNama,
      item.supplierNama
    ].some((value) => String(value ?? "").toLowerCase().includes(normalized))
  );
}

async function loadLookupMaps() {
  if (!supabase) {
    return {
      kategoriById: {} as Record<number, string>,
      supplierById: {} as Record<number, string>
    };
  }

  const [kategoriResult, supplierResult] = await Promise.all([
    supabase.from("kategori_obat").select("id,nama"),
    supabase.from("supplier").select("id,nama_supplier")
  ]);

  if (kategoriResult.error) {
    throw new Error(kategoriResult.error.message);
  }

  if (supplierResult.error) {
    throw new Error(supplierResult.error.message);
  }

  const kategoriById = Object.fromEntries(
    (kategoriResult.data ?? []).map((item) => [item.id, item.nama])
  );
  const supplierById = Object.fromEntries(
    (supplierResult.data ?? []).map((item) => [item.id, item.nama_supplier])
  );

  return { kategoriById, supplierById };
}

export const obatService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterObat(localObat, params.search), params);
    }

    const [{ data, error }, stokResult, lookupMaps] = await Promise.all([
      supabase.from("obat").select("*").order("created_at", { ascending: false }),
      supabase.from("stok").select("obat_id,jumlah"),
      loadLookupMaps()
    ]);

    if (error) {
      throw new Error(error.message);
    }

    if (stokResult.error) {
      throw new Error(stokResult.error.message);
    }

    const stockByObat = stockMapFrom(stokResult.data ?? []);
    const rows = filterObat(
      (data ?? []).map((item) =>
        toObat(item, stockByObat, lookupMaps.kategoriById, lookupMaps.supplierById)
      ),
      params.search
    );

    return paginate(rows, params);
  },

  async search(query: string) {
    const result = await this.list({ search: query, perPage: 30 });
    return result.data.filter((item) => item.status);
  },

  async getById(id: number) {
    if (!isSupabaseConfigured || !supabase) {
      return localObat.find((item) => item.id === id) ?? null;
    }

    const [{ data, error }, stokResult, lookupMaps] = await Promise.all([
      supabase.from("obat").select("*").eq("id", id).single(),
      supabase.from("stok").select("obat_id,jumlah").eq("obat_id", id),
      loadLookupMaps()
    ]);

    if (error) {
      throw new Error(error.message);
    }

    if (stokResult.error) {
      throw new Error(stokResult.error.message);
    }

    return data
      ? toObat(
          data,
          stockMapFrom(stokResult.data ?? []),
          lookupMaps.kategoriById,
          lookupMaps.supplierById
        )
      : null;
  },

  async create(payload: ObatInput): Promise<ObatListItem> {
    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const created = {
        id: Date.now(),
        kodeObat: payload.kodeObat,
        namaObat: payload.namaObat,
        kategoriId: payload.kategoriId ?? 0,
        supplierId: payload.supplierId ?? 0,
        satuan: payload.satuan ?? "",
        hargaBeli: payload.hargaBeli ?? 0,
        hargaJual: payload.hargaJual ?? 0,
        stokMinimum: payload.stokMinimum ?? 0,
        stokTersedia: payload.stokAwal ?? 0,
        gambarUrl: payload.gambarUrl ?? "",
        deskripsi: payload.deskripsi ?? "",
        golongan: payload.golongan ?? "bebas",
        membutuhkanResep: payload.membutuhkanResep ?? false,
        status: payload.status ?? true,
        createdAt: now,
        updatedAt: now
      };
      localObat.unshift(created);
      return created;
    }

    const { data, error } = await supabase
      .from("obat")
      .insert(toObatRow(payload))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const stokAwal = Number(payload.stokAwal ?? 0);

    if (stokAwal > 0) {
      const { error: stokError } = await supabase.from("stok").insert({
        obat_id: data.id,
        batch_number: payload.batchNumber ?? `AWAL-${data.kode_obat}`,
        tanggal_expired: payload.tanggalExpired || null,
        jumlah: stokAwal,
        lokasi: payload.lokasi ?? "Rak utama"
      });

      if (stokError) {
        throw new Error(stokError.message);
      }
    }

    const created = await this.getById(data.id);

    if (!created) {
      throw new Error("Obat berhasil dibuat, tetapi data tidak dapat dimuat ulang");
    }

    return created;
  },

  async update(id: number, payload: ObatInput): Promise<ObatListItem | null> {
    if (!isSupabaseConfigured || !supabase) {
      const index = localObat.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }

      localObat[index] = {
        ...localObat[index],
        kodeObat: payload.kodeObat,
        namaObat: payload.namaObat,
        kategoriId: payload.kategoriId ?? 0,
        supplierId: payload.supplierId ?? 0,
        satuan: payload.satuan ?? "",
        hargaBeli: payload.hargaBeli ?? 0,
        hargaJual: payload.hargaJual ?? 0,
        stokMinimum: payload.stokMinimum ?? 0,
        gambarUrl: payload.gambarUrl ?? "",
        deskripsi: payload.deskripsi ?? "",
        golongan: payload.golongan ?? "bebas",
        membutuhkanResep: payload.membutuhkanResep ?? false,
        status: payload.status ?? true,
        updatedAt: new Date().toISOString()
      };

      return localObat[index];
    }

    const { data, error } = await supabase
      .from("obat")
      .update(toObatRow(payload))
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.getById(data.id);
  },

  async delete(id: number) {
    if (!isSupabaseConfigured || !supabase) {
      const index = localObat.findIndex((item) => item.id === id);
      if (index >= 0) {
        localObat.splice(index, 1);
      }

      return { id, success: true };
    }

    const { error: stokError } = await supabase
      .from("stok")
      .delete()
      .eq("obat_id", id);

    if (stokError) {
      throw new Error(stokError.message);
    }

    const { error } = await supabase.from("obat").delete().eq("id", id);

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
      .from("kategori_obat")
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
      .select("id,nama_supplier")
      .eq("status", true)
      .order("nama_supplier", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      label: item.nama_supplier
    }));
  }
};
