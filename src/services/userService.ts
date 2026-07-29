import { users as localUsers } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { RoleName, User } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface UserInput {
  namaLengkap: string;
  username?: string;
  email?: string;
  telepon?: string;
  role: RoleName;
  status?: boolean;
  cabangIds?: string[];
  defaultCabangId?: string;
}

interface PenggunaCabangRow {
  cabang_id: string;
  default_cabang: boolean | null;
}

interface PenggunaRow {
  id: string;
  auth_user_id: string | null;
  nama_lengkap: string;
  username: string | null;
  email: string | null;
  telepon: string | null;
  role_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  role?: { kode: RoleName; nama: string } | { kode: RoleName; nama: string }[] | null;
  pengguna_cabang?: PenggunaCabangRow[] | null;
}

function firstOf<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
}

function toUser(row: PenggunaRow): User {
  const roleRow = firstOf(row.role);
  const cabangRows = row.pengguna_cabang ?? [];
  const defaultCabang = cabangRows.find((item) => item.default_cabang);

  return {
    id: row.id,
    authUserId: row.auth_user_id ?? undefined,
    namaLengkap: row.nama_lengkap,
    username: row.username ?? undefined,
    email: row.email ?? undefined,
    telepon: row.telepon ?? undefined,
    role: (roleRow?.kode ?? "kasir") as RoleName,
    roleId: row.role_id ?? undefined,
    status: (row.status ?? "aktif") === "aktif",
    cabangIds: cabangRows.map((item) => item.cabang_id),
    defaultCabangId: defaultCabang?.cabang_id ?? cabangRows[0]?.cabang_id,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? ""
  };
}

function filterUsers(rows: User[], search?: string) {
  return matchSearch(rows, search, ["namaLengkap", "email", "role"]);
}

export async function resolveRoleId(role: RoleName): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("role").select("id").eq("kode", role).single();

  if (error) {
    if ("code" in error && error.code === "PGRST116") {
      return null;
    }

    throw new Error(error.message);
  }

  return data?.id ?? null;
}

async function syncPenggunaCabang(penggunaId: string, cabangIds: string[], defaultCabangId?: string) {
  if (!supabase) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("pengguna_cabang")
    .delete()
    .eq("pengguna_id", penggunaId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!cabangIds.length) {
    return;
  }

  const rows = cabangIds.map((cabangId) => ({
    pengguna_id: penggunaId,
    cabang_id: cabangId,
    default_cabang: cabangId === (defaultCabangId ?? cabangIds[0])
  }));

  const { error: insertError } = await supabase.from("pengguna_cabang").insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export const userService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterUsers(localUsers, params.search), params));
    }

    const { data, error } = await supabase
      .from("pengguna")
      .select("*, role(kode,nama), pengguna_cabang(cabang_id,default_cabang)")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterUsers((data ?? []).map(toUser), params.search);
    return paginate(rows, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localUsers.find((item) => item.id === id) ?? null);
    }

    const { data, error } = await supabase
      .from("pengguna")
      .select("*, role(kode,nama), pengguna_cabang(cabang_id,default_cabang)")
      .eq("id", id)
      .single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data ? toUser(data) : null;
  },

  async create(payload: UserInput): Promise<User> {
    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      return delay({
        id: `local-${Date.now()}`,
        namaLengkap: payload.namaLengkap,
        username: payload.username,
        email: payload.email,
        telepon: payload.telepon,
        role: payload.role,
        status: payload.status ?? true,
        cabangIds: payload.cabangIds ?? [],
        defaultCabangId: payload.defaultCabangId,
        createdAt: now,
        updatedAt: now
      });
    }

    const roleId = await resolveRoleId(payload.role);

    const { data, error } = await supabase
      .from("pengguna")
      .insert({
        nama_lengkap: payload.namaLengkap,
        username: payload.username ?? null,
        email: payload.email ?? null,
        telepon: payload.telepon ?? null,
        role_id: roleId,
        status: (payload.status ?? true) ? "aktif" : "nonaktif",
        updated_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (payload.cabangIds?.length) {
      await syncPenggunaCabang(data.id, payload.cabangIds, payload.defaultCabangId);
    }

    const created = await this.getById(data.id);

    if (!created) {
      throw new Error("Pengguna berhasil dibuat, tetapi data tidak dapat dimuat ulang");
    }

    return created;
  },

  async update(id: string, payload: UserInput): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(null);
    }

    const roleId = await resolveRoleId(payload.role);

    const { error } = await supabase
      .from("pengguna")
      .update({
        nama_lengkap: payload.namaLengkap,
        username: payload.username ?? null,
        email: payload.email ?? null,
        telepon: payload.telepon ?? null,
        role_id: roleId,
        status: (payload.status ?? true) ? "aktif" : "nonaktif",
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    if (payload.cabangIds) {
      await syncPenggunaCabang(id, payload.cabangIds, payload.defaultCabangId);
    }

    return this.getById(id);
  },

  async delete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return delay({ id, success: true });
    }

    const { error: cabangError } = await supabase
      .from("pengguna_cabang")
      .delete()
      .eq("pengguna_id", id);

    if (cabangError) {
      throw new Error(cabangError.message);
    }

    const { error } = await supabase.from("pengguna").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  }
};
