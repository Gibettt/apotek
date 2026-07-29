import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface EnsureOwnerPayload {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Tidak tersedia di production." }, { status: 404 });
  }

  const payload = (await request.json()) as EnsureOwnerPayload;
  const email = payload.email?.trim().toLowerCase();

  if (email !== "owner@gmail.com" || !payload.password) {
    return NextResponse.json({ message: "Email owner atau password tidak valid." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ message: "Konfigurasi Supabase server belum tersedia." }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (users.error) {
    return NextResponse.json({ message: users.error.message }, { status: 500 });
  }

  let authUser = users.data.users.find((user) => user.email?.toLowerCase() === email);

  if (!authUser) {
    const created = await admin.auth.admin.createUser({
      email,
      password: payload.password,
      email_confirm: true,
      user_metadata: { nama_lengkap: "Owner Apotek" }
    });

    if (created.error || !created.data.user) {
      return NextResponse.json({ message: created.error?.message ?? "Owner gagal dibuat." }, { status: 400 });
    }

    authUser = created.data.user;
  } else {
    const updated = await admin.auth.admin.updateUserById(authUser.id, {
      password: payload.password,
      email_confirm: true,
      user_metadata: { nama_lengkap: "Owner Apotek" }
    });

    if (updated.error) {
      return NextResponse.json({ message: updated.error.message }, { status: 400 });
    }
  }

  const role = await admin.from("role").select("id").eq("kode", "owner").single();
  if (role.error || !role.data?.id) {
    return NextResponse.json({ message: "Role owner belum tersedia di database." }, { status: 500 });
  }

  let existing = await admin.from("pengguna").select("id").eq("auth_user_id", authUser.id).maybeSingle();
  if (existing.error) {
    return NextResponse.json({ message: existing.error.message }, { status: 500 });
  }

  if (!existing.data) {
    existing = await admin.from("pengguna").select("id").eq("email", email).maybeSingle();

    if (existing.error) {
      return NextResponse.json({ message: existing.error.message }, { status: 500 });
    }
  }

  if (existing.data?.id) {
    const updated = await admin
      .from("pengguna")
      .update({ auth_user_id: authUser.id, nama_lengkap: "Owner Apotek", email, role_id: role.data.id, status: "aktif" })
      .eq("id", existing.data.id);

    if (updated.error) {
      return NextResponse.json({ message: updated.error.message }, { status: 500 });
    }
  } else {
    const inserted = await admin.from("pengguna").insert({
      auth_user_id: authUser.id,
      nama_lengkap: "Owner Apotek",
      email,
      role_id: role.data.id,
      status: "aktif"
    });

    if (inserted.error) {
      return NextResponse.json({ message: inserted.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
