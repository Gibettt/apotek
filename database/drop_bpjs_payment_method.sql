begin;

delete from public.pembayaran
where lower(metode::text) = 'bpjs';

alter table public.pembayaran
  drop constraint if exists pembayaran_metode_check;

alter table public.pembayaran
  add constraint pembayaran_metode_check
  check (metode in ('tunai', 'transfer', 'accurate'));

commit;
