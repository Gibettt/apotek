import { dokterList as localDokterList } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Dokter } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface MasterOption {
  id: string;
  label: string;
}

export interface DokterInput {
  kode: string;
  nama: string;
  nomorSip?: string;
  spesialisId?: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  aktif?: boolean;
}

function toDokterRow(payload: DokterInput) {
  return {
    kode: payload.kode,
    nama: payload.nama,
    nomor_sip: payload.nomorSip || null,
    spesialis_id: payload.spesialisId || null,
    telepon: payload.telepon || null,
    email: payload.email || null,
    alamat: payload.alamat || null,
    aktif: payload.aktif ?? true,
    updated_at: new Date().toISOString()
  };
}

interface DokterRow {
  id: string;
  kode: string;
  nama: string;
  nomor_sip: string | null;
  spesialis_id: string | null;
  telepon: string | null;
  email: string | null;
  alamat: string | null;
  aktif: boolean | null;
  dokter_spesialis?: { nama: string } | { nama: string }[] | null;
}

function firstOf<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
}

function toDokter(row: DokterRow): Dokter {
  const spesialis = firstOf(row.dokter_spesialis);

  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    nomorSip: row.nomor_sip ?? undefined,
    spesialisId: row.spesialis_id ?? undefined,
    spesialisNama: spesialis?.nama,
    telepon: row.telepon ?? undefined,
    email: row.email ?? undefined,
    alamat: row.alamat ?? undefined,
    aktif: row.aktif ?? true
  };
}

function filterDokter(rows: Dokter[], search?: string) {
  return matchSearch(rows, search, ["kode", "nama", "nomorSip"]);
}

export const dokterService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterDokter(localDokterList, params.search), params));
    }

    const { data, error } = await supabase
      .from("dokter")
      .select("*,dokter_spesialis(nama)")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterDokter((data ?? []).map(toDokter), params.search);
    return paginate(rows, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localDokterList.find((item) => item.id === id) ?? null);
    }

    const { data, error } = await supabase
      .from("dokter")
      .select("*,dokter_spesialis(nama)")
      .eq("id", id)
      .single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data ? toDokter(data) : null;
  },

  async create(payload: DokterInput): Promise<Dokter> {
    if (!isSupabaseConfigured || !supabase) {
      return delay({
        id: `local-${Date.now()}`,
        kode: payload.kode,
        nama: payload.nama,
        nomorSip: payload.nomorSip,
        spesialisId: payload.spesialisId,
        telepon: payload.telepon,
        email: payload.email,
        alamat: payload.alamat,
        aktif: payload.aktif ?? true
      });
    }

    const { data, error } = await supabase
      .from("dokter")
      .insert(toDokterRow(payload))
      .select("*,dokter_spesialis(nama)")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toDokter(data);
  },

  async update(id: string, payload: DokterInput): Promise<Dokter | null> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(null);
    }

    const { data, error } = await supabase
      .from("dokter")
      .update(toDokterRow(payload))
      .eq("id", id)
      .select("*,dokter_spesialis(nama)")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toDokter(data) : null;
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay({ id, success: true });
    }

    const { error } = await supabase.from("dokter").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  },

  async listOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localDokterList.filter((item) => item.aktif).map((item) => ({ id: item.id, label: item.nama }));
    }

    const { data, error } = await supabase
      .from("dokter")
      .select("id,nama")
      .eq("aktif", true)
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  },

  async listSpesialisOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("dokter_spesialis")
      .select("id,nama")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  }
};
