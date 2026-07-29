import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { RegisterPayload, RoleName } from "@/types";

interface PenggunaRow {
  id: string;
  auth_user_id: string | null;
  nama_lengkap: string;
  email: string | null;
  status: string | null;
  role?: { kode: RoleName } | { kode: RoleName }[] | null;
  pengguna_cabang?: Array<{ cabang_id: string; default_cabang: boolean | null }> | null;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as RegisterPayload;
  const email = payload.email?.trim().toLowerCase();

  if (!payload.namaLengkap?.trim() || !email || !payload.password) {
    return NextResponse.json({ message: "Nama, email, dan password wajib diisi." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ message: "Konfigurasi Supabase server belum tersedia." }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: authData, error: createError } = await admin.auth.admin.createUser({
    email,
    password: payload.password,
    email_confirm: true,
    user_metadata: { nama_lengkap: payload.namaLengkap.trim() }
  });

  if (createError || !authData.user) {
    const message = createError?.message?.toLowerCase().includes("already")
      ? "Email sudah terdaftar. Silakan login."
      : createError?.message ?? "Registrasi gagal";
    return NextResponse.json({ message }, { status: 400 });
  }

  const authUserId = authData.user.id;
  const { data: roleRow, error: roleError } = await admin
    .from("role")
    .select("id")
    .eq("kode", "kasir")
    .single();

  if (roleError || !roleRow?.id) {
    return NextResponse.json({ message: "Role kasir belum tersedia di database." }, { status: 500 });
  }

  const userSelect = "id,auth_user_id,nama_lengkap,email,status,role(kode),pengguna_cabang(cabang_id,default_cabang)";
  let { data: pengguna, error: penggunaError } = await admin
    .from("pengguna")
    .select(userSelect)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (penggunaError) {
    return NextResponse.json({ message: penggunaError.message }, { status: 500 });
  }

  if (!pengguna) {
    const { data: inserted, error: insertError } = await admin
      .from("pengguna")
      .insert({
        auth_user_id: authUserId,
        nama_lengkap: payload.namaLengkap.trim(),
        email,
        role_id: roleRow.id,
        status: "aktif"
      })
      .select(userSelect)
      .single();

    if (insertError || !inserted) {
      return NextResponse.json({ message: insertError?.message ?? "Data pengguna gagal disimpan." }, { status: 500 });
    }

    pengguna = inserted;
  }

  return NextResponse.json({
    requiresEmailConfirmation: false,
    session: null
  });
}
