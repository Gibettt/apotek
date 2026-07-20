import { pelanggan as localPelanggan } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Pelanggan } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface PelangganInput {
  kode?: string;
  nama: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  tanggalLahir?: string;
  jenisKelamin?: "L" | "P";
  catatanAlergi?: string;
  member?: boolean;
  aktif?: boolean;
}

interface PelangganRow {
  id: string;
  kode: string;
  nama: string;
  telepon: string | null;
  email: string | null;
  alamat: string | null;
  tanggal_lahir: string | null;
  jenis_kelamin: string | null;
  catatan_alergi: string | null;
  member: boolean | null;
  aktif: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

function generateKodePelanggan() {
  return `PLG-${String(Date.now()).slice(-8)}`;
}

function toPelanggan(row: PelangganRow): Pelanggan {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    telepon: row.telepon ?? undefined,
    email: row.email ?? undefined,
    alamat: row.alamat ?? undefined,
    tanggalLahir: row.tanggal_lahir ?? undefined,
    jenisKelamin: row.jenis_kelamin === "L" || row.jenis_kelamin === "P" ? row.jenis_kelamin : undefined,
    catatanAlergi: row.catatan_alergi ?? undefined,
    member: row.member ?? false,
    aktif: row.aktif ?? true,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? ""
  };
}

function toPelangganRow(payload: PelangganInput) {
  return {
    kode: payload.kode?.trim() || generateKodePelanggan(),
    nama: payload.nama,
    telepon: payload.telepon ?? null,
    email: payload.email ?? null,
    alamat: payload.alamat ?? null,
    tanggal_lahir: payload.tanggalLahir || null,
    jenis_kelamin: payload.jenisKelamin ?? null,
    catatan_alergi: payload.catatanAlergi ?? null,
    member: payload.member ?? false,
    aktif: payload.aktif ?? true
  };
}

function filterPelanggan(rows: Pelanggan[], search?: string) {
  return matchSearch(rows, search, ["kode", "nama", "telepon", "alamat"]);
}

export const pelangganService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterPelanggan(localPelanggan, params.search), params));
    }

    const { data, error } = await supabase
      .from("pelanggan")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterPelanggan((data ?? []).map(toPelanggan), params.search);
    return paginate(rows, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localPelanggan.find((item) => item.id === id) ?? null);
    }

    const { data, error } = await supabase
      .from("pelanggan")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data ? toPelanggan(data) : null;
  },

  async create(payload: PelangganInput): Promise<Pelanggan> {
    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      return delay({
        id: `local-${Date.now()}`,
        kode: payload.kode?.trim() || generateKodePelanggan(),
        nama: payload.nama,
        telepon: payload.telepon,
        email: payload.email,
        alamat: payload.alamat,
        tanggalLahir: payload.tanggalLahir,
        jenisKelamin: payload.jenisKelamin,
        catatanAlergi: payload.catatanAlergi,
        member: payload.member ?? false,
        aktif: payload.aktif ?? true,
        createdAt: now,
        updatedAt: now
      });
    }

    const { data, error } = await supabase
      .from("pelanggan")
      .insert(toPelangganRow(payload))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toPelanggan(data);
  },

  async update(id: string, payload: PelangganInput): Promise<Pelanggan | null> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(null);
    }

    const { data, error } = await supabase
      .from("pelanggan")
      .update(toPelangganRow(payload))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toPelanggan(data) : null;
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay({ id, success: true });
    }

    const { error } = await supabase.from("pelanggan").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  }
};
