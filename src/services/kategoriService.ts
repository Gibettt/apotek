import { kategoriBarang as localKategoriBarang } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { KategoriBarang } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface KategoriBarangInput {
  kode: string;
  nama: string;
  deskripsi?: string;
  aktif?: boolean;
}

export interface MasterOption {
  id: string;
  label: string;
}

interface KategoriBarangRow {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  aktif: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

function toKategoriBarang(row: KategoriBarangRow): KategoriBarang {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    deskripsi: row.deskripsi ?? undefined,
    aktif: row.aktif ?? true,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? ""
  };
}

function toKategoriBarangRow(payload: KategoriBarangInput) {
  return {
    kode: payload.kode,
    nama: payload.nama,
    deskripsi: payload.deskripsi ?? "",
    aktif: payload.aktif ?? true,
    updated_at: new Date().toISOString()
  };
}

function filterKategori(rows: KategoriBarang[], search?: string) {
  return matchSearch(rows, search, ["kode", "nama", "deskripsi"]);
}

export const kategoriService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterKategori(localKategoriBarang, params.search), params));
    }

    const { data, error } = await supabase
      .from("kategori_barang")
      .select("*")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterKategori((data ?? []).map(toKategoriBarang), params.search);
    return paginate(rows, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localKategoriBarang.find((item) => item.id === id) ?? null);
    }

    const { data, error } = await supabase
      .from("kategori_barang")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data ? toKategoriBarang(data) : null;
  },

  async create(payload: KategoriBarangInput): Promise<KategoriBarang> {
    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      return delay({
        id: `local-${Date.now()}`,
        kode: payload.kode,
        nama: payload.nama,
        deskripsi: payload.deskripsi,
        aktif: payload.aktif ?? true,
        createdAt: now,
        updatedAt: now
      });
    }

    const { data, error } = await supabase
      .from("kategori_barang")
      .insert(toKategoriBarangRow(payload))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toKategoriBarang(data);
  },

  async update(id: string, payload: KategoriBarangInput): Promise<KategoriBarang | null> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(null);
    }

    const { data, error } = await supabase
      .from("kategori_barang")
      .update(toKategoriBarangRow(payload))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toKategoriBarang(data) : null;
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay({ id, success: true });
    }

    const { error } = await supabase.from("kategori_barang").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  },

  async listOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localKategoriBarang.map((item) => ({ id: item.id, label: item.nama }));
    }

    const { data, error } = await supabase
      .from("kategori_barang")
      .select("id,nama")
      .eq("aktif", true)
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  }
};
