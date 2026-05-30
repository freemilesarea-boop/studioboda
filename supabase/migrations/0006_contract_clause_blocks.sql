-- ============================================================
-- STUDIO BODA · contract_clause_blocks (Contract Template Engine)
-- ============================================================
-- DB-overridable clause registry for the 3-layer contract engine
-- (common + service + quote). Built-in blocks live in code
-- (lib/contracts/blocks.ts); rows here OVERRIDE a built-in (same key) or ADD
-- a brand-new clause — so a new service needs only new rows, NO code change.
-- Empty table = built-ins only. Additive + idempotent.
-- ============================================================

create extension if not exists pgcrypto with schema public;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.contract_clause_blocks (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  scope text not null default 'common'
    check (scope in ('common','service','quote')),
  template_kinds text[],
  condition text not null default 'always'
    check (condition in ('always','recurring','has_deliverables')),
  title text not null,
  body text not null,
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contract_clause_blocks_scope_idx
  on public.contract_clause_blocks (scope, sort_order);
drop trigger if exists contract_clause_blocks_updated on public.contract_clause_blocks;
create trigger contract_clause_blocks_updated before update
  on public.contract_clause_blocks
  for each row execute function public.set_updated_at();

alter table public.contract_clause_blocks enable row level security;
drop policy if exists contract_clause_blocks_staff_all on public.contract_clause_blocks;
create policy contract_clause_blocks_staff_all on public.contract_clause_blocks
  for all using (public.is_staff()) with check (public.is_staff());
