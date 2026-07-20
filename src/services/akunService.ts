import { akunList } from "@/lib/erp-mock";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface Akun {
  id: string;
  kode: string;
  nama: string;
  tipe: string;
  aktif: boolean;
  parentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AkunInput {
  kode: string;
  nama: string;
  tipe: string;
  aktif?: boolean;
  parentId?: string;
}

interface AkunRow {
  id: string;
  kode: string;
  nama: string;
  tipe: string;
  aktif: boolean | null;
  parent_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function toAkun(row: AkunRow): Akun {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    tipe: row.tipe,
    aktif: row.aktif ?? true,
    parentId: row.parent_id ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined
  };
}

function toAkunRow(payload: AkunInput) {
  return {
    kode: payload.kode.trim(),
    nama: payload.nama.trim(),
    tipe: payload.tipe.trim(),
    aktif: payload.aktif ?? true,
    parent_id: payload.parentId ?? null,
    updated_at: new Date().toISOString()
  };
}

function filterAkun(rows: Akun[], search?: string) {
  return matchSearch(rows, search, ["kode", "nama", "tipe"]);
}

export const akunService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterAkun([...akunList], params.search), params));
    }

    const { data, error } = await supabase
      .from("akun")
      .select("id,kode,nama,tipe,aktif,parent_id,created_at,updated_at")
      .order("kode", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterAkun((data ?? []).map(toAkun), params.search);
    return paginate(rows, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(akunList.find((item) => item.id === id) ?? null);
    }

    const { data, error } = await supabase
      .from("akun")
      .select("id,kode,nama,tipe,aktif,parent_id,created_at,updated_at")
      .eq("id", id)
      .single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data ? toAkun(data) : null;
  },

  async create(payload: AkunInput): Promise<Akun> {
    if (!isSupabaseConfigured || !supabase) {
      const created = {
        id: `local-${Date.now()}`,
        kode: payload.kode.trim(),
        nama: payload.nama.trim(),
        tipe: payload.tipe.trim(),
        aktif: payload.aktif ?? true
      };
      akunList.unshift(created);
      return delay(created);
    }

    const { data, error } = await supabase
      .from("akun")
      .insert(toAkunRow(payload))
      .select("id,kode,nama,tipe,aktif,parent_id,created_at,updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toAkun(data);
  },

  async update(id: string, payload: AkunInput): Promise<Akun | null> {
    if (!isSupabaseConfigured || !supabase) {
      const index = akunList.findIndex((item) => item.id === id);
      if (index >= 0) {
        akunList[index] = {
          ...akunList[index],
          kode: payload.kode.trim(),
          nama: payload.nama.trim(),
          tipe: payload.tipe.trim(),
          aktif: payload.aktif ?? true
        };
        return delay(akunList[index]);
      }

      return delay(null);
    }

    const { data, error } = await supabase
      .from("akun")
      .update(toAkunRow(payload))
      .eq("id", id)
      .select("id,kode,nama,tipe,aktif,parent_id,created_at,updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toAkun(data) : null;
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      const index = akunList.findIndex((item) => item.id === id);
      if (index >= 0) {
        akunList.splice(index, 1);
      }

      return delay({ id, success: true });
    }

    const { error } = await supabase.from("akun").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  }
};
