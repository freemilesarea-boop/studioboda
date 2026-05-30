-- ============================================================
-- STUDIO BODA · Launch Schema Completion (public schema)
-- ============================================================
-- Codifies tables that the application code already references but
-- which were never captured in a committed migration (they had been
-- applied ad-hoc to the remote project via Supabase MCP). Bringing
-- them under source control makes the schema reproducible for CI,
-- fresh environments, and disaster recovery.
--
-- Tables created here:
--   organizations          (admin org switcher; FK target for *.organization_id)
--   subscriptions          (PayApp recurring billing)
--   subscription_invoices  (monthly charge records)
--   ai_assets              (AI generation outputs)
--   brand_profiles         (per-customer brand kit)
--   portfolio_items        (public portfolio / case studies)
--   project_comments       (project collaboration thread)
--
-- Naming note — project_messages vs project_comments:
--   Migration 0002 defined `public.project_messages`, but the shipped
--   application exclusively uses `public.project_comments` (different
--   shape: is_internal flag instead of audience enum). This migration
--   creates the table the code actually reads/writes. `project_messages`
--   (and the likewise-unused `revision_requests` / `orders` from 0002)
--   are intentionally LEFT IN PLACE — dropping them would be destructive
--   and they may hold rows. They are simply dormant.
--
-- Idempotent: safe to re-run. Uses `if not exists`, `drop ... if exists`
-- before `create`, and `on conflict do nothing` for seed data. Running
-- against the live project (where these objects already exist) is a no-op.
-- ============================================================

-- Shared helpers (re-declared defensively; identical to 0002) -------------
create extension if not exists pgcrypto with schema public;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- These role helpers are created in 0002; re-declare so this migration can
-- also stand alone for the RLS policies below.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin','manager','designer') from public.profiles where id = auth.uid()), false)
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- ============================================================
-- organizations
-- ============================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  display_name text,
  brand_color text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists organizations_active_idx on public.organizations (active, name);
drop trigger if exists organizations_updated on public.organizations;
create trigger organizations_updated before update on public.organizations
  for each row execute function public.set_updated_at();

-- Seed a default operating org ONLY when the table is empty, so re-running
-- this migration against the live project (which already has an org) never
-- creates a duplicate.
insert into public.organizations (slug, name, display_name, brand_color, active)
select 'studioboda', 'STUDIO BODA', 'STUDIO BODA', '#5847FF', true
where not exists (select 1 from public.organizations);

-- ============================================================
-- subscriptions  (PayApp recurring)
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  -- FK to profiles (not auth.users) so PostgREST can embed
  -- `profile:user_id(email,name,company_name)`. SET NULL preserves the
  -- billing record when a customer deletes their account.
  user_id uuid references public.profiles(id) on delete set null,
  plan_key text not null,
  plan_name text not null,
  monthly_amount integer not null default 0,
  description text,
  status text not null default 'pending_card'
    check (status in ('pending_card','active','past_due','canceled','paused')),
  payapp_billing_key text,
  payapp_registration_url text,
  payapp_registration_mul_no text,
  started_at timestamptz,
  current_period_start date,
  current_period_end date,
  next_charge_at date,
  retry_count integer not null default 0,
  last_failure_at timestamptz,
  last_failure_reason text,
  canceled_at timestamptz,
  canceled_reason text,
  canceled_by_actor text check (canceled_by_actor in ('customer','staff','system')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
-- The cron query filters on status + next_charge_at + billing key presence.
create index if not exists subscriptions_due_idx
  on public.subscriptions (next_charge_at)
  where status in ('active','past_due') and payapp_billing_key is not null;
drop trigger if exists subscriptions_updated on public.subscriptions;
create trigger subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- subscription_invoices  (monthly charge attempts)
-- ============================================================
create table if not exists public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  amount integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending','paid','failed','canceled')),
  period_start date,
  period_end date,
  attempt_number integer not null default 1,
  charged_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  payapp_mul_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscription_invoices_sub_idx
  on public.subscription_invoices (subscription_id, created_at desc);
create index if not exists subscription_invoices_status_idx
  on public.subscription_invoices (status);
drop trigger if exists subscription_invoices_updated on public.subscription_invoices;
create trigger subscription_invoices_updated before update on public.subscription_invoices
  for each row execute function public.set_updated_at();

-- ============================================================
-- ai_assets  (AI generation outputs)
-- ============================================================
create table if not exists public.ai_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  -- Matches the live schema: references auth.users (== profiles.id). SET NULL
  -- preserves the asset when a customer account is deleted.
  user_id uuid references auth.users(id) on delete set null,
  kind text not null
    check (kind in ('brief','copy','headline','cta','description','design_prompt')),
  prompt text,
  output text not null,
  provider text,
  model text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_assets_project_idx on public.ai_assets (project_id, created_at desc);
create index if not exists ai_assets_quote_idx on public.ai_assets (quote_id, created_at desc);
create index if not exists ai_assets_kind_idx on public.ai_assets (kind);
create index if not exists ai_assets_created_idx on public.ai_assets (created_at desc);
drop trigger if exists ai_assets_updated on public.ai_assets;
create trigger ai_assets_updated before update on public.ai_assets
  for each row execute function public.set_updated_at();

-- ============================================================
-- brand_profiles  (per-customer brand kit; one row per user)
-- ============================================================
create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  -- One brand profile per customer; upsert(onConflict: "user_id") relies on
  -- this uniqueness. References auth.users (== profiles.id) to match the live
  -- schema. CASCADE: brand data belongs to the user, removed with the account.
  user_id uuid not null unique references auth.users(id) on delete cascade,
  brand_name text,
  brand_colors text,
  reference_sites text,
  tone text,
  forbidden_expressions text,
  go_to_phrases text,
  notes text,
  logo_file_path text,
  past_assets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists brand_profiles_updated on public.brand_profiles;
create trigger brand_profiles_updated before update on public.brand_profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- portfolio_items  (public case studies)
-- ============================================================
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  title text not null,
  slug text unique not null,
  client_name text,
  brand_name text,
  service_type text,
  category text,
  description text,
  problem text,
  solution text,
  result_summary text,
  metrics jsonb not null default '{}'::jsonb,
  thumbnail_url text,
  images jsonb not null default '[]'::jsonb,
  proof_files jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Public listing orders by is_featured, sort_order, published_at and filters status.
create index if not exists portfolio_items_published_idx
  on public.portfolio_items (status, is_featured desc, sort_order, published_at desc);
create index if not exists portfolio_items_slug_idx on public.portfolio_items (slug);
drop trigger if exists portfolio_items_updated on public.portfolio_items;
create trigger portfolio_items_updated before update on public.portfolio_items
  for each row execute function public.set_updated_at();

-- Storage bucket for portfolio image / proof uploads (admin uploads via
-- service role; public read for published asset URLs).
insert into storage.buckets (id, name, public)
values ('portfolio-assets', 'portfolio-assets', true)
on conflict (id) do nothing;

-- ============================================================
-- project_comments  (collaboration thread; supersedes project_messages)
-- ============================================================
create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  -- FK to profiles so PostgREST can embed `author:profiles!author_id(...)`.
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  is_internal boolean not null default false,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists project_comments_project_idx
  on public.project_comments (project_id, created_at desc);
create index if not exists project_comments_client_idx
  on public.project_comments (project_id) where is_internal = false;

-- ============================================================
-- Row Level Security
-- ============================================================
-- The application accesses these tables server-side with the service-role
-- key (which bypasses RLS). Policies below are defense-in-depth: they keep
-- RLS enabled (no table is left open) and define least-privilege access for
-- the anon / authenticated roles in case of any client-side access.

alter table public.organizations        enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.subscription_invoices enable row level security;
alter table public.ai_assets             enable row level security;
alter table public.brand_profiles        enable row level security;
alter table public.portfolio_items       enable row level security;
alter table public.project_comments      enable row level security;

-- organizations: staff read, admin manage
drop policy if exists organizations_staff_read on public.organizations;
create policy organizations_staff_read on public.organizations
  for select using (public.is_staff());
drop policy if exists organizations_admin_all on public.organizations;
create policy organizations_admin_all on public.organizations
  for all using (public.is_admin()) with check (public.is_admin());

-- subscriptions: owner reads own, staff manage
drop policy if exists subscriptions_owner_read on public.subscriptions;
create policy subscriptions_owner_read on public.subscriptions
  for select using (user_id = auth.uid());
drop policy if exists subscriptions_staff_all on public.subscriptions;
create policy subscriptions_staff_all on public.subscriptions
  for all using (public.is_staff()) with check (public.is_staff());

-- subscription_invoices: owner reads invoices of own subscriptions, staff manage
drop policy if exists subscription_invoices_owner_read on public.subscription_invoices;
create policy subscription_invoices_owner_read on public.subscription_invoices
  for select using (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  );
drop policy if exists subscription_invoices_staff_all on public.subscription_invoices;
create policy subscription_invoices_staff_all on public.subscription_invoices
  for all using (public.is_staff()) with check (public.is_staff());

-- ai_assets: internal — staff only (plus owner read for transparency)
drop policy if exists ai_assets_owner_read on public.ai_assets;
create policy ai_assets_owner_read on public.ai_assets
  for select using (user_id = auth.uid());
drop policy if exists ai_assets_staff_all on public.ai_assets;
create policy ai_assets_staff_all on public.ai_assets
  for all using (public.is_staff()) with check (public.is_staff());

-- brand_profiles: owner manages own, staff manage
drop policy if exists brand_profiles_owner_all on public.brand_profiles;
create policy brand_profiles_owner_all on public.brand_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists brand_profiles_staff_all on public.brand_profiles;
create policy brand_profiles_staff_all on public.brand_profiles
  for all using (public.is_staff()) with check (public.is_staff());

-- portfolio_items: anyone reads published, staff manage everything
drop policy if exists portfolio_items_public_read on public.portfolio_items;
create policy portfolio_items_public_read on public.portfolio_items
  for select using (status = 'published' or public.is_staff());
drop policy if exists portfolio_items_staff_all on public.portfolio_items;
create policy portfolio_items_staff_all on public.portfolio_items
  for all using (public.is_staff()) with check (public.is_staff());

-- project_comments: owner reads client-visible comments on own projects,
-- owner may post client comments; staff manage everything.
drop policy if exists project_comments_owner_read on public.project_comments;
create policy project_comments_owner_read on public.project_comments
  for select using (
    is_internal = false and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
drop policy if exists project_comments_owner_insert on public.project_comments;
create policy project_comments_owner_insert on public.project_comments
  for insert with check (
    is_internal = false
    and author_id = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
drop policy if exists project_comments_staff_all on public.project_comments;
create policy project_comments_staff_all on public.project_comments
  for all using (public.is_staff()) with check (public.is_staff());

-- ============================================================
-- Grants (least privilege; service role bypasses all of this)
-- ============================================================
-- Public site reads published portfolio entries.
grant select on public.portfolio_items to anon, authenticated;
-- Authenticated customers may read/manage their own rows (RLS-scoped).
grant select on public.subscriptions, public.subscription_invoices to authenticated;
grant select, insert, update on public.brand_profiles to authenticated;
grant select, insert on public.project_comments to authenticated;
