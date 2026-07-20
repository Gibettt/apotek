import { biayaOperasionalList as localBiayaList } from "@/lib/erp-mock";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface BiayaOperasional {
  id: string;
  nomor: string;
  tanggal: string;
  namaBiaya: string;
  jumlah: number;
  metodeBayar: string;
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BiayaOperasionalInput {
  nomor?: string;
  tanggal: string;
  namaBiaya: string;
  jumlah: number;
  metodeBayar: string;
  catatan?: string;
}

interface BiayaRow {
  id: string;
  nomor: string;
  tanggal: string;
  nama_biaya: string;
  jumlah: number;
  metode_bayar: string | null;
  catatan: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function generateNomorBiaya() {
  const yyyy = new Date().getFullYear();
  return `BOP-${yyyy}-${String(Date.now()).slice(-4)}`;
}

function toBiayaOperasional(row: BiayaRow): BiayaOperasional {
  return {
    id: row.id,
    nomor: row.nomor,
    tanggal: row.tanggal,
    namaBiaya: row.nama_biaya,
    jumlah: Number(row.jumlah),
    metodeBayar: row.metode_bayar ?? "tunai",
    catatan: row.catatan ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined
  };
}

function toBiayaRow(payload: BiayaOperasionalInput) {
  return {
    nomor: payload.nomor?.trim() || generateNomorBiaya(),
    tanggal: payload.tanggal,
    nama_biaya: payload.namaBiaya,
    jumlah: payload.jumlah,
    metode_bayar: payload.metodeBayar,
    catatan: payload.catatan ?? null
  };
}

function filterBiaya(rows: BiayaOperasional[], search?: string) {
  return matchSearch(rows, search, ["nomor", "namaBiaya", "catatan"]);
}

export const biayaService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterBiaya(localBiayaList as BiayaOperasional[], params.search), params));
    }

    const { data, error } = await supabase
      .from("biaya_operasional")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterBiaya((data ?? []).map(toBiayaOperasional), params.search);
    return paginate(rows, params);
  },

  async getById(id: string): Promise<BiayaOperasional | null> {
    if (!isSupabaseConfigured || !supabase) {
      return delay((localBiayaList as BiayaOperasional[]).find((item) => item.id === id) ?? null);
    }

    const { data, error } = await supabase
      .from("biaya_operasional")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }
      throw new Error(error.message);
    }

    return data ? toBiayaOperasional(data) : null;
  },

  async create(payload: BiayaOperasionalInput): Promise<BiayaOperasional> {
    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      return delay({
        id: `local-${Date.now()}`,
        nomor: payload.nomor?.trim() || generateNomorBiaya(),
        tanggal: payload.tanggal,
        namaBiaya: payload.namaBiaya,
        jumlah: payload.jumlah,
        metodeBayar: payload.metodeBayar,
        catatan: payload.catatan,
        createdAt: now,
        updatedAt: now
      });
    }

    const { data, error } = await supabase
      .from("biaya_operasional")
      .insert(toBiayaRow(payload))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toBiayaOperasional(data);
  },

  async update(id: string, payload: BiayaOperasionalInput): Promise<BiayaOperasional | null> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(null);
    }

    const { data, error } = await supabase
      .from("biaya_operasional")
      .update(toBiayaRow(payload))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toBiayaOperasional(data) : null;
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay({ id, success: true });
    }

    const { error } = await supabase.from("biaya_operasional").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  }
};
