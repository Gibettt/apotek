import { suppliers } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Supplier } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface SupplierInput {
  kode?: string;
  nama: string;
  tipeSupplier?: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  kota?: string;
  provinsi?: string;
  kontakPerson?: string;
  npwp?: string;
  tempoBayarHari?: number;
  aktif?: boolean;
}

interface SupplierRow {
  id: string;
  kode: string;
  nama: string;
  tipe_supplier: string | null;
  npwp: string | null;
  telepon: string | null;
  email: string | null;
  alamat: string | null;
  kota: string | null;
  provinsi: string | null;
  contact_person: string | null;
  tempo_bayar_hari: number | null;
  aktif: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

function toSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    tipeSupplier: row.tipe_supplier ?? undefined,
    npwp: row.npwp ?? "",
    telepon: row.telepon ?? "",
    email: row.email ?? "",
    alamat: row.alamat ?? "",
    kota: row.kota ?? undefined,
    provinsi: row.provinsi ?? undefined,
    kontakPerson: row.contact_person ?? "",
    tempoBayarHari: row.tempo_bayar_hari ?? 0,
    aktif: row.aktif ?? true,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? ""
  };
}

function toSupplierRow(payload: SupplierInput) {
  return {
    kode: payload.kode?.trim() || `SUP-${Date.now()}`,
    nama: payload.nama,
    tipe_supplier: payload.tipeSupplier ?? null,
    telepon: payload.telepon ?? null,
    email: payload.email ?? null,
    alamat: payload.alamat ?? null,
    kota: payload.kota ?? null,
    provinsi: payload.provinsi ?? null,
    contact_person: payload.kontakPerson ?? null,
    npwp: payload.npwp ?? null,
    tempo_bayar_hari: payload.tempoBayarHari ?? 0,
    aktif: payload.aktif ?? true
  };
}

function filterSuppliers(rows: Supplier[], search?: string) {
  return matchSearch(rows, search, ["nama", "telepon", "email", "kontakPerson"]);
}

export const supplierService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterSuppliers(suppliers, params.search), params));
    }

    const { data, error } = await supabase
      .from("supplier")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterSuppliers((data ?? []).map((item) => toSupplier(item)), params.search);
    return paginate(rows, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(suppliers.find((item) => item.id === id) ?? null);
    }

    const { data, error } = await supabase
      .from("supplier")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toSupplier(data) : null;
  },

  async create(payload: SupplierInput) {
    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      return delay({
        id: crypto.randomUUID(),
        kode: payload.kode?.trim() || `SUP-${Date.now()}`,
        nama: payload.nama,
        tipeSupplier: payload.tipeSupplier,
        telepon: payload.telepon ?? "",
        email: payload.email ?? "",
        alamat: payload.alamat ?? "",
        kota: payload.kota,
        provinsi: payload.provinsi,
        kontakPerson: payload.kontakPerson ?? "",
        npwp: payload.npwp ?? "",
        tempoBayarHari: payload.tempoBayarHari ?? 0,
        aktif: payload.aktif ?? true,
        createdAt: now,
        updatedAt: now
      });
    }

    const { data, error } = await supabase
      .from("supplier")
      .insert(toSupplierRow(payload))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toSupplier(data);
  },

  async update(id: string, payload: SupplierInput) {
    if (!isSupabaseConfigured || !supabase) {
      return delay({
        id,
        kode: payload.kode?.trim() || `SUP-${Date.now()}`,
        nama: payload.nama,
        tipeSupplier: payload.tipeSupplier,
        telepon: payload.telepon ?? "",
        email: payload.email ?? "",
        alamat: payload.alamat ?? "",
        kota: payload.kota,
        provinsi: payload.provinsi,
        kontakPerson: payload.kontakPerson ?? "",
        npwp: payload.npwp ?? "",
        tempoBayarHari: payload.tempoBayarHari ?? 0,
        aktif: payload.aktif ?? true,
        createdAt: "",
        updatedAt: new Date().toISOString()
      });
    }

    const { data, error } = await supabase
      .from("supplier")
      .update(toSupplierRow(payload))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toSupplier(data);
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      const index = suppliers.findIndex((item) => item.id === id);
      if (index >= 0) {
        suppliers.splice(index, 1);
      }

      return delay({ id, success: true });
    }

    const { error } = await supabase.from("supplier").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  }
};
