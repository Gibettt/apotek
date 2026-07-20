import { currentUser } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AuthSession, AuthUser, LoginCredentials, RoleName } from "@/types";

interface PenggunaCabangRow {
  cabang_id: string;
  default_cabang: boolean | null;
}

interface PenggunaAuthRow {
  id: string;
  auth_user_id: string | null;
  nama_lengkap: string;
  email: string | null;
  status: string | null;
  role?: { kode: RoleName } | { kode: RoleName }[] | null;
  pengguna_cabang?: PenggunaCabangRow[] | null;
}

function firstOf<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
}

async function loadPenggunaAsAuthUser(authUserId: string, fallbackEmail?: string): Promise<AuthUser | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("pengguna")
    .select("id,auth_user_id,nama_lengkap,email,status,role(kode),pengguna_cabang(cabang_id,default_cabang)")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) {
    if ("code" in error && error.code === "PGRST116") {
      return null;
    }

    throw new Error(error.message);
  }

  const row = data as PenggunaAuthRow;
  const roleRow = firstOf(row.role);
  const cabangRows = row.pengguna_cabang ?? [];
  const defaultCabang = cabangRows.find((item) => item.default_cabang);

  return {
    id: row.id,
    authUserId: row.auth_user_id ?? undefined,
    name: row.nama_lengkap,
    email: row.email ?? fallbackEmail ?? "",
    role: (roleRow?.kode ?? "kasir") as RoleName,
    status: (row.status ?? "aktif") === "aktif",
    cabangIds: cabangRows.map((item) => item.cabang_id),
    activeCabangId: defaultCabang?.cabang_id ?? cabangRows[0]?.cabang_id
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    if (!credentials.email || !credentials.password) {
      throw new Error("Email dan password wajib diisi.");
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        accessToken: "mock-supabase-jwt",
        user: {
          ...currentUser,
          email: credentials.email
        }
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Login gagal, sesi tidak ditemukan.");
    }

    const user = await loadPenggunaAsAuthUser(data.user.id, data.user.email ?? credentials.email);

    if (!user) {
      throw new Error("Akun ditemukan di Supabase Auth, tetapi data pengguna tidak terdaftar.");
    }

    await supabase
      .from("pengguna")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    return {
      accessToken: data.session.access_token,
      user
    };
  },

  async logout() {
    if (!isSupabaseConfigured || !supabase) {
      return true;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },

  async me(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured || !supabase) {
      return currentUser;
    }

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return loadPenggunaAsAuthUser(data.user.id, data.user.email ?? undefined);
  }
};
