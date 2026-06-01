-- ============================================================
-- STUDIO BODA · Notification channels (in_app / email / kakao)
-- ============================================================
-- Adds:
--   * notification consent columns on profiles (email / kakao opt-in)
--   * notification_settings (key-value: channel on/off, kakao template codes)
--   * notification_deliveries (per-channel send audit incl. kakao dryRun)
-- Additive + idempotent. The web (in_app) channel is always on; email/kakao
-- are gated by global settings + per-customer consent.
-- ============================================================

create extension if not exists pgcrypto with schema public;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ---- consent columns (default: email on, kakao off until phone+consent) ----
alter table public.profiles
  add column if not exists email_opt_in boolean not null default true;
alter table public.profiles
  add column if not exists kakao_opt_in boolean not null default false;

-- ---- global notification settings (admin-managed key/value) ----
create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.notification_settings enable row level security;
drop policy if exists notification_settings_admin on public.notification_settings;
create policy notification_settings_admin on public.notification_settings
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.notification_settings (key, value)
select 'channels', jsonb_build_object('email', true, 'kakao', false)
where not exists (select 1 from public.notification_settings where key='channels');

-- ---- per-channel delivery audit (in_app/email/kakao; ok/failed/skipped/dryrun)
create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  channel text not null check (channel in ('in_app','email','kakao')),
  status text not null check (status in ('sent','failed','skipped','dryrun')),
  template_code text,
  to_address text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists notification_deliveries_user_idx
  on public.notification_deliveries (user_id, created_at desc);
create index if not exists notification_deliveries_channel_idx
  on public.notification_deliveries (channel, status, created_at desc);
alter table public.notification_deliveries enable row level security;
drop policy if exists notification_deliveries_staff on public.notification_deliveries;
create policy notification_deliveries_staff on public.notification_deliveries
  for select using (public.is_staff());
