create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  waktu timestamptz not null default now(),
  aksi varchar(20) not null,
  nama_tabel varchar(80) not null,
  record_id text,
  deskripsi text,
  pengguna_id uuid references public.pengguna(id) on delete set null,
  pengguna_nama varchar(120),
  pengguna_email varchar(160),
  created_at timestamptz not null default now()
);

alter table public.audit_log
  add column if not exists pengguna_email varchar(160);

create index if not exists audit_log_waktu_idx on public.audit_log(waktu desc);
create index if not exists audit_log_nama_tabel_idx on public.audit_log(nama_tabel);
create index if not exists audit_log_aksi_idx on public.audit_log(aksi);
