import { currentUser } from "@/lib/mock-data";
import { isOwnerEmail, resolveEffectiveRole } from "@/constants/roles";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterPayload,
  RegisterResult,
  RoleName
} from "@/types";

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

function mockUserForEmail(email: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase();
  const isOwner = isOwnerEmail(normalizedEmail);

  return {
    ...currentUser,
    id: isOwner ? currentUser.id : "00000000-0000-0000-0000-0000000000a1",
    name: isOwner ? "Owner Apotek" : "Admin Apotek",
    email,
    role: isOwner ? "owner" : "admin"
  };
}

async function ensureDevOwner(email: string, password: string) {
  if (process.env.NODE_ENV === "production" || !isOwnerEmail(email)) {
    return false;
  }

  const response = await fetch("/api/auth/ensure-owner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(result.message ?? "Owner gagal disiapkan di Supabase.");
  }

  return true;
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

  const email = row.email ?? fallbackEmail ?? "";
  const role = (roleRow?.kode ?? "kasir") as RoleName;

  return {
    id: row.id,
    authUserId: row.auth_user_id ?? undefined,
    name: row.nama_lengkap,
    email,
    role: resolveEffectiveRole(role, email),
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
        user: mockUserForEmail(credentials.email)
      };
    }

    let { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      const ensured = await ensureDevOwner(credentials.email, credentials.password);

      if (!ensured) {
        throw new Error(error.message);
      }

      const retry = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      data = retry.data;
      error = retry.error;

      if (error) {
        throw new Error(error.message);
      }
    }

    if (!data.user || !data.session) {
      throw new Error("Login gagal, sesi tidak ditemukan.");
    }

    const user = await loadPenggunaAsAuthUser(data.user.id, data.user.email ?? credentials.email);

    if (!user) {
      throw new Error("Akun ditemukan di Supabase Auth, tetapi data pengguna tidak terdaftar.");
    }

    void supabase
      .from("pengguna")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id)
      .then(({ error }) => {
        if (error) console.warn(error.message);
      });

    return {
      accessToken: data.session.access_token,
      user
    };
  },

  async register(payload: RegisterPayload): Promise<RegisterResult> {
    if (!payload.namaLengkap || !payload.email || !payload.password) {
      throw new Error("Nama, email, dan password wajib diisi.");
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = (await response.json()) as RegisterResult & { message?: string };

    if (!response.ok) {
      throw new Error(result.message ?? "Registrasi gagal");
    }

    return result;
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
