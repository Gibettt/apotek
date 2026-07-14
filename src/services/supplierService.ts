import { suppliers } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Supplier } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface SupplierInput {
  namaSupplier: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  kontakPerson?: string;
  npwp?: string;
  status?: boolean;
}

interface SupplierRow {
  id: number;
  nama_supplier: string;
  telepon: string | null;
  email: string | null;
  alamat: string | null;
  kontak_person: string | null;
  npwp: string | null;
  status: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

function toSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    namaSupplier: row.nama_supplier,
    telepon: row.telepon ?? "",
    email: row.email ?? "",
    alamat: row.alamat ?? "",
    kontakPerson: row.kontak_person ?? "",
    npwp: row.npwp ?? "",
    status: row.status ?? true,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? ""
  };
}

function toSupplierRow(payload: SupplierInput) {
  return {
    nama_supplier: payload.namaSupplier,
    telepon: payload.telepon ?? "",
    email: payload.email ?? "",
    alamat: payload.alamat ?? "",
    kontak_person: payload.kontakPerson ?? "",
    npwp: payload.npwp ?? "",
    status: payload.status ?? true,
    updated_at: new Date().toISOString()
  };
}

function filterSuppliers(rows: Supplier[], search?: string) {
  return matchSearch(rows, search, [
    "namaSupplier",
    "telepon",
    "email",
    "kontakPerson"
  ]);
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

  async getById(id: number) {
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
        id: Date.now(),
        namaSupplier: payload.namaSupplier,
        telepon: payload.telepon ?? "",
        email: payload.email ?? "",
        alamat: payload.alamat ?? "",
        kontakPerson: payload.kontakPerson ?? "",
        npwp: payload.npwp ?? "",
        status: payload.status ?? true,
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

  async update(id: number, payload: SupplierInput) {
    if (!isSupabaseConfigured || !supabase) {
      return delay({
        id,
        namaSupplier: payload.namaSupplier,
        telepon: payload.telepon ?? "",
        email: payload.email ?? "",
        alamat: payload.alamat ?? "",
        kontakPerson: payload.kontakPerson ?? "",
        npwp: payload.npwp ?? "",
        status: payload.status ?? true,
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
  }
};
