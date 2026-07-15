import { cabangList as localCabangList } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Cabang } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

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
  }
};
