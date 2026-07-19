import { kategoriBarang as localKategoriBarang } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { KategoriBarang } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface KategoriBarangInput {
  kode?: string;
  nama: string;
  deskripsi?: string;
  aktif?: boolean;
}

export interface MasterOption {
  id: string;
  label: string;
}

function generateKategoriKode(nama?: string) {
  const normalized = String(nama ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  return `KAT_${normalized || Date.now()}`;
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
  const row: Record<string, string | boolean> = {
    nama: payload.nama,
    deskripsi: payload.deskripsi ?? "",
    aktif: payload.aktif ?? true,
    updated_at: new Date().toISOString()
  };

  if (payload.kode !== undefined) {
    row.kode = payload.kode;
  }

  return row;
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
    const normalizedPayload = {
      ...payload,
      kode: payload.kode?.trim() || generateKategoriKode(payload.nama)
    };

    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      return delay({
        id: `local-${Date.now()}`,
        kode: normalizedPayload.kode,
        nama: normalizedPayload.nama,
        deskripsi: normalizedPayload.deskripsi,
        aktif: normalizedPayload.aktif ?? true,
        createdAt: now,
        updatedAt: now
      });
    }

    const { data, error } = await supabase
      .from("kategori_barang")
      .insert(toKategoriBarangRow(normalizedPayload))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toKategoriBarang(data);
  },

  async update(id: string, payload: KategoriBarangInput): Promise<KategoriBarang | null> {
    if (!isSupabaseConfigured || !supabase) {
      const index = localKategoriBarang.findIndex((item) => item.id === id);
      if (index === -1) {
        return delay(null);
      }

      localKategoriBarang[index] = {
        ...localKategoriBarang[index],
        kode: payload.kode ?? localKategoriBarang[index].kode,
        nama: payload.nama,
        deskripsi: payload.deskripsi,
        aktif: payload.aktif ?? localKategoriBarang[index].aktif,
        updatedAt: new Date().toISOString()
      };

      return delay(localKategoriBarang[index]);
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
