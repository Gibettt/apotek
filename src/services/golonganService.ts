import { golonganObat as localGolonganObat } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { GolonganObat } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface GolonganObatInput {
  kode: string;
  nama: string;
  butuhResep?: boolean;
  butuhSuratPesanan?: boolean;
  deskripsi?: string;
  aktif?: boolean;
}

export interface MasterOption {
  id: string;
  label: string;
}

interface GolonganObatRow {
  id: string;
  kode: string;
  nama: string;
  butuh_resep: boolean | null;
  butuh_surat_pesanan: boolean | null;
  deskripsi: string | null;
  aktif: boolean | null;
}

function toGolonganObat(row: GolonganObatRow): GolonganObat {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    butuhResep: row.butuh_resep ?? false,
    butuhSuratPesanan: row.butuh_surat_pesanan ?? false,
    deskripsi: row.deskripsi ?? undefined,
    aktif: row.aktif ?? true
  };
}

function toGolonganObatRow(payload: GolonganObatInput) {
  return {
    kode: payload.kode,
    nama: payload.nama,
    butuh_resep: payload.butuhResep ?? false,
    butuh_surat_pesanan: payload.butuhSuratPesanan ?? false,
    deskripsi: payload.deskripsi ?? "",
    aktif: payload.aktif ?? true,
    updated_at: new Date().toISOString()
  };
}

function filterGolongan(rows: GolonganObat[], search?: string) {
  return matchSearch(rows, search, ["kode", "nama", "deskripsi"]);
}

export const golonganService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterGolongan(localGolonganObat, params.search), params));
    }

    const { data, error } = await supabase
      .from("golongan_obat")
      .select("id,kode,nama,butuh_resep,butuh_surat_pesanan,deskripsi,aktif")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterGolongan((data ?? []).map(toGolonganObat), params.search);
    return paginate(rows, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localGolonganObat.find((item) => item.id === id) ?? null);
    }

    const { data, error } = await supabase
      .from("golongan_obat")
      .select("id,kode,nama,butuh_resep,butuh_surat_pesanan,deskripsi,aktif")
      .eq("id", id)
      .single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data ? toGolonganObat(data) : null;
  },

  async create(payload: GolonganObatInput): Promise<GolonganObat> {
    if (!isSupabaseConfigured || !supabase) {
      return delay({
        id: `local-${Date.now()}`,
        kode: payload.kode,
        nama: payload.nama,
        butuhResep: payload.butuhResep ?? false,
        butuhSuratPesanan: payload.butuhSuratPesanan ?? false,
        deskripsi: payload.deskripsi,
        aktif: payload.aktif ?? true
      });
    }

    const { data, error } = await supabase
      .from("golongan_obat")
      .insert(toGolonganObatRow(payload))
      .select("id,kode,nama,butuh_resep,butuh_surat_pesanan,deskripsi,aktif")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toGolonganObat(data);
  },

  async update(id: string, payload: GolonganObatInput): Promise<GolonganObat | null> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(null);
    }

    const { data, error } = await supabase
      .from("golongan_obat")
      .update(toGolonganObatRow(payload))
      .eq("id", id)
      .select("id,kode,nama,butuh_resep,butuh_surat_pesanan,deskripsi,aktif")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toGolonganObat(data) : null;
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay({ id, success: true });
    }

    const { error } = await supabase.from("golongan_obat").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  },

  async listOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localGolonganObat.map((item) => ({ id: item.id, label: item.nama }));
    }

    const { data, error } = await supabase
      .from("golongan_obat")
      .select("id,nama")
      .eq("aktif", true)
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  }
};
