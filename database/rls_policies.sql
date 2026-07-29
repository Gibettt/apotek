-- ============================================================
-- RLS lockdown + auto-provision kasir account on signup.
-- Run this once in Supabase SQL editor (idempotent, safe to re-run).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Helpers: current logged-in user's role code / pengguna id.
--    security definer so they can read pengguna/role even after
--    RLS is enabled below, without leaking rows to the caller.
-- ------------------------------------------------------------
create or replace function public.current_pengguna_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.kode
  from public.pengguna p
  join public.role r on r.id = p.role_id
  where p.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_pengguna_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.pengguna p
  where p.auth_user_id = auth.uid()
  limit 1
$$;

-- ------------------------------------------------------------
-- 2. Auto-create `pengguna` row when someone signs up via
--    /daftar. Role is always kasir — self-registration can
--    never grant owner/admin/apoteker. Runs server-side as the
--    same transaction as the auth.users insert, so the client
--    never needs INSERT permission on pengguna at all.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kasir_role_id uuid;
begin
  select id into kasir_role_id from public.role where kode = 'kasir' limit 1;

  insert into public.pengguna (auth_user_id, nama_lengkap, email, role_id, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama_lengkap', new.email),
    new.email,
    kasir_role_id,
    'aktif'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. Enable RLS on every application table.
--    Default-deny: no policy below means no access at all.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'cabang','pengguna','pengguna_cabang','akun','dokter','dokter_spesialis',
    'biaya_operasional','jurnal_umum','jurnal_umum_detail','golongan_obat',
    'kategori_barang','penjualan','penjualan_detail','pelanggan','pembayaran',
    'lokasi_simpan','barang','kartu_stok','saldo_stok','harga_barang',
    'batch_barang','satuan','jenis_barang','pabrik',
    'konversi_satuan','notifikasi','pengaturan','resep','resep_detail',
    'retur_penjualan','retur_penjualan_detail','retur_pembelian',
    'retur_pembelian_detail','faktur_pembelian','faktur_pembelian_detail',
    'supplier','role','barcode_barang'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 4. pengguna — own row, or owner/admin sees all.
--    No INSERT policy: rows are only ever created by the
--    security-definer trigger above (or by userService.create,
--    which owner/admin already gate at the app layer).
-- ------------------------------------------------------------
drop policy if exists pengguna_select on public.pengguna;
create policy pengguna_select on public.pengguna
  for select
  using (
    auth_user_id = auth.uid()
    or public.current_pengguna_role() in ('owner', 'admin')
  );

drop policy if exists pengguna_update on public.pengguna;
create policy pengguna_update on public.pengguna
  for update
  using (
    auth_user_id = auth.uid()
    or public.current_pengguna_role() in ('owner', 'admin')
  )
  with check (
    auth_user_id = auth.uid()
    or public.current_pengguna_role() in ('owner', 'admin')
  );

drop policy if exists pengguna_delete on public.pengguna;
create policy pengguna_delete on public.pengguna
  for delete
  using (public.current_pengguna_role() = 'owner');

-- ------------------------------------------------------------
-- 5. pengguna_cabang — own assignment, or owner/admin manage all.
-- ------------------------------------------------------------
drop policy if exists pengguna_cabang_select on public.pengguna_cabang;
create policy pengguna_cabang_select on public.pengguna_cabang
  for select
  using (
    pengguna_id = public.current_pengguna_id()
    or public.current_pengguna_role() in ('owner', 'admin')
  );

drop policy if exists pengguna_cabang_write on public.pengguna_cabang;
create policy pengguna_cabang_write on public.pengguna_cabang
  for all
  using (public.current_pengguna_role() in ('owner', 'admin'))
  with check (public.current_pengguna_role() in ('owner', 'admin'));

-- ------------------------------------------------------------
-- 6. Reference / master data — every logged-in staff can read,
--    only owner/admin can write.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'cabang', 'akun', 'dokter', 'dokter_spesialis', 'golongan_obat',
    'kategori_barang', 'lokasi_simpan', 'satuan', 'jenis_barang',
    'pabrik', 'supplier', 'role', 'pengaturan'
  ]
  loop
    execute format('drop policy if exists %I_staff_select on public.%I;', t, t);
    execute format(
      'create policy %I_staff_select on public.%I for select using (public.current_pengguna_role() is not null);',
      t, t
    );

    execute format('drop policy if exists %I_admin_write on public.%I;', t, t);
    execute format(
      'create policy %I_admin_write on public.%I for all using (public.current_pengguna_role() in (''owner'', ''admin'')) with check (public.current_pengguna_role() in (''owner'', ''admin''));',
      t, t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- 7. Obat / stok domain — every staff reads, owner/admin/apoteker
--    write (apoteker manages obat, stok, batch, opname).
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'barang', 'harga_barang', 'batch_barang', 'saldo_stok',
    'kartu_stok', 'konversi_satuan', 'barcode_barang'
  ]
  loop
    execute format('drop policy if exists %I_staff_select on public.%I;', t, t);
    execute format(
      'create policy %I_staff_select on public.%I for select using (public.current_pengguna_role() is not null);',
      t, t
    );

    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format(
      'create policy %I_write on public.%I for all using (public.current_pengguna_role() in (''owner'', ''admin'', ''apoteker'')) with check (public.current_pengguna_role() in (''owner'', ''admin'', ''apoteker''));',
      t, t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- 8. Penjualan / transaksi domain — every staff reads,
--    owner/admin/kasir write (kasir runs the POS).
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'penjualan', 'penjualan_detail', 'pembayaran', 'pelanggan',
    'retur_penjualan', 'retur_penjualan_detail'
  ]
  loop
    execute format('drop policy if exists %I_staff_select on public.%I;', t, t);
    execute format(
      'create policy %I_staff_select on public.%I for select using (public.current_pengguna_role() is not null);',
      t, t
    );

    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format(
      'create policy %I_write on public.%I for all using (public.current_pengguna_role() in (''owner'', ''admin'', ''kasir'')) with check (public.current_pengguna_role() in (''owner'', ''admin'', ''kasir''));',
      t, t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- 9. Resep — every staff reads, owner/admin/apoteker write
--    (apoteker verifies resep).
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['resep', 'resep_detail']
  loop
    execute format('drop policy if exists %I_staff_select on public.%I;', t, t);
    execute format(
      'create policy %I_staff_select on public.%I for select using (public.current_pengguna_role() is not null);',
      t, t
    );

    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format(
      'create policy %I_write on public.%I for all using (public.current_pengguna_role() in (''owner'', ''admin'', ''apoteker'')) with check (public.current_pengguna_role() in (''owner'', ''admin'', ''apoteker''));',
      t, t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- 10. Pembelian / retur pembelian — owner/admin only, both
--     read and write. Kasir and apoteker have no business here.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'faktur_pembelian', 'faktur_pembelian_detail',
    'retur_pembelian', 'retur_pembelian_detail'
  ]
  loop
    execute format('drop policy if exists %I_admin_all on public.%I;', t, t);
    execute format(
      'create policy %I_admin_all on public.%I for all using (public.current_pengguna_role() in (''owner'', ''admin'')) with check (public.current_pengguna_role() in (''owner'', ''admin''));',
      t, t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- 11. Finance / akuntansi — owner/admin only.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['jurnal_umum', 'jurnal_umum_detail', 'biaya_operasional']
  loop
    execute format('drop policy if exists %I_admin_all on public.%I;', t, t);
    execute format(
      'create policy %I_admin_all on public.%I for all using (public.current_pengguna_role() in (''owner'', ''admin'')) with check (public.current_pengguna_role() in (''owner'', ''admin''));',
      t, t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- 12. Notifikasi — every staff reads and can mark read; only
--     owner/admin can delete.
-- ------------------------------------------------------------
drop policy if exists notifikasi_staff_select on public.notifikasi;
create policy notifikasi_staff_select on public.notifikasi
  for select
  using (public.current_pengguna_role() is not null);

drop policy if exists notifikasi_staff_insert on public.notifikasi;
create policy notifikasi_staff_insert on public.notifikasi
  for insert
  with check (public.current_pengguna_role() is not null);

drop policy if exists notifikasi_staff_update on public.notifikasi;
create policy notifikasi_staff_update on public.notifikasi
  for update
  using (public.current_pengguna_role() is not null)
  with check (public.current_pengguna_role() is not null);

drop policy if exists notifikasi_admin_delete on public.notifikasi;
create policy notifikasi_admin_delete on public.notifikasi
  for delete
  using (public.current_pengguna_role() in ('owner', 'admin'));
