import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { generateAutoKode } from "@/utils/autoKode";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface MasterOption {
  id: string;
  label: string;
}

export interface KodeNamaDeskripsi {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
  aktif: boolean;
}

export interface KodeNamaDeskripsiInput {
  kode?: string;
  nama: string;
  deskripsi?: string;
  aktif?: boolean;
}

interface KodeNamaDeskripsiRow {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  aktif: boolean | null;
}

function toKodeNamaDeskripsi(row: KodeNamaDeskripsiRow): KodeNamaDeskripsi {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    deskripsi: row.deskripsi ?? undefined,
    aktif: row.aktif ?? true
  };
}

function toKodeNamaDeskripsiRow(payload: KodeNamaDeskripsiInput) {
  return {
    kode: payload.kode,
    nama: payload.nama,
    deskripsi: payload.deskripsi ?? "",
    aktif: payload.aktif ?? true,
    updated_at: new Date().toISOString()
  };
}

function createKodeNamaDeskripsiService(table: string, kodePrefix = "MST") {
  return {
    async list(params: ListParams = {}) {
      if (!isSupabaseConfigured || !supabase) {
        return delay(paginate([] as KodeNamaDeskripsi[], params));
      }

      const { data, error } = await supabase
        .from(table)
        .select("id,kode,nama,deskripsi,aktif")
        .order("nama", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const rows = matchSearch(
        (data ?? []).map(toKodeNamaDeskripsi),
        params.search,
        ["kode", "nama", "deskripsi"]
      );

      return paginate(rows, params);
    },

    async getById(id: string) {
      if (!isSupabaseConfigured || !supabase) {
        return delay(null);
      }

      const { data, error } = await supabase
        .from(table)
        .select("id,kode,nama,deskripsi,aktif")
        .eq("id", id)
        .single();

      if (error) {
        if ("code" in error && error.code === "PGRST116") {
          return null;
        }

        throw new Error(error.message);
      }

      return data ? toKodeNamaDeskripsi(data) : null;
    },

    async create(payload: KodeNamaDeskripsiInput): Promise<KodeNamaDeskripsi> {
      const normalizedPayload = {
        ...payload,
        kode:
          payload.kode?.trim() ||
          generateAutoKode(payload.nama ?? "", { prefix: kodePrefix }) ||
          `${kodePrefix}_${Date.now()}`
      };

      if (!isSupabaseConfigured || !supabase) {
        return delay({
          id: `local-${Date.now()}`,
          kode: normalizedPayload.kode,
          nama: normalizedPayload.nama,
          deskripsi: normalizedPayload.deskripsi,
          aktif: normalizedPayload.aktif ?? true
        });
      }

      const { data, error } = await supabase
        .from(table)
        .insert(toKodeNamaDeskripsiRow(normalizedPayload))
        .select("id,kode,nama,deskripsi,aktif")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return toKodeNamaDeskripsi(data);
    },

    async update(id: string, payload: KodeNamaDeskripsiInput): Promise<KodeNamaDeskripsi | null> {
      if (!isSupabaseConfigured || !supabase) {
        return delay(null);
      }

      const { data, error } = await supabase
        .from(table)
        .update(toKodeNamaDeskripsiRow(payload))
        .eq("id", id)
        .select("id,kode,nama,deskripsi,aktif")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data ? toKodeNamaDeskripsi(data) : null;
    },

    async delete(id: string) {
      if (!isSupabaseConfigured || !supabase) {
        return delay({ id, success: true });
      }

      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return { id, success: true };
    },

    async listOptions(): Promise<MasterOption[]> {
      if (!isSupabaseConfigured || !supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from(table)
        .select("id,nama")
        .eq("aktif", true)
        .order("nama", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
    }
  };
}

export const satuanMasterService = createKodeNamaDeskripsiService("satuan");

export interface PabrikPrincipal {
  id: string;
  kode: string;
  nama: string;
  alamat?: string;
  telepon?: string;
  aktif: boolean;
}

export interface PabrikPrincipalInput {
  kode: string;
  nama: string;
  alamat?: string;
  telepon?: string;
  aktif?: boolean;
}

interface PabrikPrincipalRow {
  id: string;
  kode: string;
  nama: string;
  alamat: string | null;
  telepon: string | null;
  aktif: boolean | null;
}

function toPabrikPrincipal(row: PabrikPrincipalRow): PabrikPrincipal {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    alamat: row.alamat ?? undefined,
    telepon: row.telepon ?? undefined,
    aktif: row.aktif ?? true
  };
}

function toPabrikPrincipalRow(payload: PabrikPrincipalInput) {
  return {
    kode: payload.kode,
    nama: payload.nama,
    alamat: payload.alamat ?? "",
    telepon: payload.telepon ?? "",
    aktif: payload.aktif ?? true,
    updated_at: new Date().toISOString()
  };
}

function createPabrikPrincipalService(table: string) {
  return {
    async list(params: ListParams = {}) {
      if (!isSupabaseConfigured || !supabase) {
        return delay(paginate([] as PabrikPrincipal[], params));
      }

      const { data, error } = await supabase
        .from(table)
        .select("id,kode,nama,alamat,telepon,aktif")
        .order("nama", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const rows = matchSearch(
        (data ?? []).map(toPabrikPrincipal),
        params.search,
        ["kode", "nama", "telepon"]
      );

      return paginate(rows, params);
    },

    async getById(id: string) {
      if (!isSupabaseConfigured || !supabase) {
        return delay(null);
      }

      const { data, error } = await supabase
        .from(table)
        .select("id,kode,nama,alamat,telepon,aktif")
        .eq("id", id)
        .single();

      if (error) {
        if ("code" in error && error.code === "PGRST116") {
          return null;
        }

        throw new Error(error.message);
      }

      return data ? toPabrikPrincipal(data) : null;
    },

    async create(payload: PabrikPrincipalInput): Promise<PabrikPrincipal> {
      if (!isSupabaseConfigured || !supabase) {
        return delay({
          id: `local-${Date.now()}`,
          kode: payload.kode,
          nama: payload.nama,
          alamat: payload.alamat,
          telepon: payload.telepon,
          aktif: payload.aktif ?? true
        });
      }

      const { data, error } = await supabase
        .from(table)
        .insert(toPabrikPrincipalRow(payload))
        .select("id,kode,nama,alamat,telepon,aktif")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return toPabrikPrincipal(data);
    },

    async update(id: string, payload: PabrikPrincipalInput): Promise<PabrikPrincipal | null> {
      if (!isSupabaseConfigured || !supabase) {
        return delay(null);
      }

      const { data, error } = await supabase
        .from(table)
        .update(toPabrikPrincipalRow(payload))
        .eq("id", id)
        .select("id,kode,nama,alamat,telepon,aktif")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data ? toPabrikPrincipal(data) : null;
    },

    async delete(id: string) {
      if (!isSupabaseConfigured || !supabase) {
        return delay({ id, success: true });
      }

      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return { id, success: true };
    },

    async listOptions(): Promise<MasterOption[]> {
      if (!isSupabaseConfigured || !supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from(table)
        .select("id,nama")
        .eq("aktif", true)
        .order("nama", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
    }
  };
}

export const pabrikService = createPabrikPrincipalService("pabrik");

export interface LokasiSimpan {
  id: string;
  kode: string;
  nama: string;
  tipeLokasi?: string;
  deskripsi?: string;
  aktif: boolean;
}

export interface LokasiSimpanInput {
  kode?: string;
  nama: string;
  tipeLokasi?: string;
  deskripsi?: string;
  aktif?: boolean;
}

interface LokasiSimpanRow {
  id: string;
  kode: string;
  nama: string;
  tipe_lokasi: string | null;
  deskripsi: string | null;
  aktif: boolean | null;
}

function toLokasiSimpan(row: LokasiSimpanRow): LokasiSimpan {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    tipeLokasi: row.tipe_lokasi ?? undefined,
    deskripsi: row.deskripsi ?? undefined,
    aktif: row.aktif ?? true
  };
}

function toLokasiSimpanRow(payload: LokasiSimpanInput) {
  return {
    kode: payload.kode,
    nama: payload.nama,
    tipe_lokasi: payload.tipeLokasi ?? null,
    deskripsi: payload.deskripsi ?? null,
    aktif: payload.aktif ?? true
  };
}

export const lokasiSimpanService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate([] as LokasiSimpan[], params));
    }

    const { data, error } = await supabase
      .from("lokasi_simpan")
      .select("id,kode,nama,tipe_lokasi,deskripsi,aktif")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = matchSearch(
      (data ?? []).map(toLokasiSimpan),
      params.search,
      ["kode", "nama", "tipeLokasi"]
    );

    return paginate(rows, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(null);
    }

    const { data, error } = await supabase
      .from("lokasi_simpan")
      .select("id,kode,nama,tipe_lokasi,deskripsi,aktif")
      .eq("id", id)
      .single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data ? toLokasiSimpan(data) : null;
  },

  async create(payload: LokasiSimpanInput): Promise<LokasiSimpan> {
    const normalizedPayload = {
      ...payload,
      kode:
        payload.kode?.trim() ||
        generateAutoKode(payload.nama ?? "", { prefix: "LKS" }) ||
        `LKS_${Date.now()}`
    };

    if (!isSupabaseConfigured || !supabase) {
      return delay({
        id: `local-${Date.now()}`,
        kode: normalizedPayload.kode,
        nama: normalizedPayload.nama,
        tipeLokasi: normalizedPayload.tipeLokasi,
        deskripsi: normalizedPayload.deskripsi,
        aktif: normalizedPayload.aktif ?? true
      });
    }

    const { data, error } = await supabase
      .from("lokasi_simpan")
      .insert(toLokasiSimpanRow(normalizedPayload))
      .select("id,kode,nama,tipe_lokasi,deskripsi,aktif")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toLokasiSimpan(data);
  },

  async update(id: string, payload: LokasiSimpanInput): Promise<LokasiSimpan | null> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(null);
    }

    const { data, error } = await supabase
      .from("lokasi_simpan")
      .update(toLokasiSimpanRow(payload))
      .eq("id", id)
      .select("id,kode,nama,tipe_lokasi,deskripsi,aktif")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toLokasiSimpan(data) : null;
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay({ id, success: true });
    }

    const { error } = await supabase.from("lokasi_simpan").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  },

  async listOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("lokasi_simpan")
      .select("id,nama")
      .eq("aktif", true)
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  }
};
