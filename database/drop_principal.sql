-- Drop the Principal/Distributor feature: obat.principal_id column, then the principal table itself.
-- Run this once against Supabase, then re-run database/rls_policies.sql (principal already removed from its arrays).

alter table public.barang drop column if exists principal_id;

drop table if exists public.principal;
