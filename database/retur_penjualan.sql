create table if not exists public.retur_penjualan (
  id uuid primary key default gen_random_uuid(),
  cabang_id uuid references public.cabang(id),
  pelanggan_id uuid not null references public.pelanggan(id),
  penjualan_id uuid not null references public.penjualan(id),
  nomor text not null unique,
  tanggal date,
  alasan text not null default '',
  total numeric not null default 0,
  status text not null default 'posted',
  dibuat_oleh uuid references public.pengguna(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.retur_penjualan_detail (
  id uuid primary key default gen_random_uuid(),
  retur_penjualan_id uuid not null references public.retur_penjualan(id) on delete cascade,
  penjualan_id uuid not null references public.penjualan(id),
  penjualan_detail_id uuid not null references public.penjualan_detail(id),
  barang_id uuid not null references public.barang(id),
  satuan_id uuid references public.satuan(id),
  qty numeric not null default 0,
  stock_qty numeric not null default 0,
  harga_jual numeric not null default 0,
  subtotal numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.retur_penjualan
  add column if not exists cabang_id uuid references public.cabang(id),
  add column if not exists pelanggan_id uuid references public.pelanggan(id),
  add column if not exists penjualan_id uuid references public.penjualan(id),
  add column if not exists nomor text,
  add column if not exists tanggal date,
  add column if not exists alasan text not null default '',
  add column if not exists total numeric not null default 0,
  add column if not exists status text not null default 'posted',
  add column if not exists dibuat_oleh uuid references public.pengguna(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.retur_penjualan_detail
  add column if not exists retur_penjualan_id uuid references public.retur_penjualan(id) on delete cascade,
  add column if not exists penjualan_id uuid references public.penjualan(id),
  add column if not exists penjualan_detail_id uuid references public.penjualan_detail(id),
  add column if not exists barang_id uuid references public.barang(id),
  add column if not exists satuan_id uuid references public.satuan(id),
  add column if not exists qty numeric not null default 0,
  add column if not exists stock_qty numeric not null default 0,
  add column if not exists harga_jual numeric not null default 0,
  add column if not exists subtotal numeric not null default 0,
  add column if not exists created_at timestamptz not null default now();

create index if not exists retur_penjualan_pelanggan_idx on public.retur_penjualan(pelanggan_id);
create index if not exists retur_penjualan_penjualan_idx on public.retur_penjualan(penjualan_id);
create index if not exists retur_penjualan_tanggal_idx on public.retur_penjualan(tanggal desc);
create index if not exists retur_penjualan_created_at_idx on public.retur_penjualan(created_at desc);
create index if not exists retur_penjualan_status_idx on public.retur_penjualan(status);
create index if not exists retur_penjualan_detail_retur_idx on public.retur_penjualan_detail(retur_penjualan_id);
create index if not exists retur_penjualan_detail_penjualan_detail_idx on public.retur_penjualan_detail(penjualan_detail_id);
create index if not exists retur_penjualan_detail_barang_idx on public.retur_penjualan_detail(barang_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'retur_penjualan_nomor_key'
      and conrelid = 'public.retur_penjualan'::regclass
  ) then
    alter table public.retur_penjualan
      add constraint retur_penjualan_nomor_key unique (nomor);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'retur_penjualan_status_check'
      and conrelid = 'public.retur_penjualan'::regclass
  ) then
    alter table public.retur_penjualan
      add constraint retur_penjualan_status_check
      check (status in ('draft', 'posted', 'dibatalkan'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'retur_penjualan_detail_qty_check'
      and conrelid = 'public.retur_penjualan_detail'::regclass
  ) then
    alter table public.retur_penjualan_detail
      add constraint retur_penjualan_detail_qty_check check (qty > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'retur_penjualan_detail_stock_qty_check'
      and conrelid = 'public.retur_penjualan_detail'::regclass
  ) then
    alter table public.retur_penjualan_detail
      add constraint retur_penjualan_detail_stock_qty_check check (stock_qty >= 0);
  end if;
end $$;

create or replace function public.set_retur_penjualan_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists retur_penjualan_set_updated_at on public.retur_penjualan;
create trigger retur_penjualan_set_updated_at
before update on public.retur_penjualan
for each row execute function public.set_retur_penjualan_updated_at();
