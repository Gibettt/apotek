do $$
declare
  jenis_table regclass := to_regclass('public.jenis_barang');
  constraint_row record;
begin
  if jenis_table is not null and to_regclass('public.barang') is not null then
    for constraint_row in
      select conname
      from pg_constraint
      where conrelid = 'public.barang'::regclass
        and confrelid = jenis_table
    loop
      execute format(
        'alter table public.barang drop constraint if exists %I',
        constraint_row.conname
      );
    end loop;
  end if;
end $$;

alter table public.barang drop column if exists jenis_id;
drop table if exists public.jenis_barang cascade;
