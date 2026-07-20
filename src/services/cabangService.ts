import { cabangList as localCabangList } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Cabang } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface CabangInput {
  kode?: string;
  nama: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  kota?: string;
  provinsi?: string;
  kodePos?: string;
  aktif?: boolean;
}

interface CabangRow {
  id: string;
  kode: string;
  nama: string;
  telepon: string | null;
  email: string | null;
  alamat: string | null;
  kota: string | null;
  provinsi: string | null;
  kode_pos: string | null;
  aktif: boolean | null;
}

function firstOf<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
}

function toCabang(row: CabangRow): Cabang {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    telepon: row.telepon ?? undefined,
    email: row.email ?? undefined,
    alamat: row.alamat ?? undefined,
    kota: row.kota ?? undefined,
    provinsi: row.provinsi ?? undefined,
    kodePos: row.kode_pos ?? undefined,
    aktif: row.aktif ?? true
  };
}

function generateKodeCabang() {
  return `CAB-${String(Date.now()).slice(-8)}`;
}

function toCabangRow(payload: CabangInput) {
  return {
    kode: payload.kode?.trim() || generateKodeCabang(),
    nama: payload.nama,
    telepon: payload.telepon ?? null,
    email: payload.email ?? null,
    alamat: payload.alamat ?? null,
    kota: payload.kota ?? null,
    provinsi: payload.provinsi ?? null,
    kode_pos: payload.kodePos ?? null,
    aktif: payload.aktif ?? true
  };
}

function filterCabang(rows: Cabang[], search?: string) {
  return matchSearch(rows, search, ["kode", "nama", "kota"]);
}

export const cabangService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterCabang(localCabangList, params.search), params));
    }

    const { data, error } = await supabase
      .from("cabang")
      .select("*")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterCabang((data ?? []).map(toCabang), params.search);
    return paginate(rows, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localCabangList.find((item) => item.id === id) ?? null);
    }

    const { data, error } = await supabase.from("cabang").select("*").eq("id", id).single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data ? toCabang(data) : null;
  },

  async listForPengguna(penggunaId: string): Promise<Cabang[]> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localCabangList);
    }

    const { data, error } = await supabase
      .from("pengguna_cabang")
      .select("cabang(id,kode,nama,telepon,email,alamat,kota,provinsi,kode_pos,aktif)")
      .eq("pengguna_id", penggunaId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? [])
      .map((row) => firstOf(row.cabang as CabangRow | CabangRow[] | null))
      .filter((item): item is CabangRow => Boolean(item))
      .map(toCabang);
  },

  async create(payload: CabangInput): Promise<Cabang> {
    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      return delay({
        id: `local-${Date.now()}`,
        kode: payload.kode?.trim() || generateKodeCabang(),
        nama: payload.nama,
        telepon: payload.telepon,
        email: payload.email,
        alamat: payload.alamat,
        kota: payload.kota,
        provinsi: payload.provinsi,
        kodePos: payload.kodePos,
        aktif: payload.aktif ?? true
      });
    }

    const { data, error } = await supabase
      .from("cabang")
      .insert(toCabangRow(payload))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toCabang(data);
  },

  async update(id: string, payload: CabangInput): Promise<Cabang | null> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(null);
    }

    const { data, error } = await supabase
      .from("cabang")
      .update(toCabangRow(payload))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toCabang(data) : null;
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay({ id, success: true });
    }

    const { error } = await supabase.from("cabang").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  }
};
