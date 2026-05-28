-- ============================================================
-- STUDIO BODA · Phase 0 · NEW dedicated project (public schema)
-- ============================================================
-- This file supersedes 0001_studioboda_init.sql for the new
-- `wxdlcjgvclyygjvimhgn` project. The old `boda` schema on the
-- shared `tyrhbiwvwmdybwaydvto` project is retained for now but
-- no longer used by the application.
--
-- Applied to remote via Supabase MCP `apply_migration`. Kept here
-- for source control + manual re-apply if needed.
-- ============================================================

create extension if not exists pgcrypto with schema public;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles ----------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text,
  name text,
  role text not null default 'client' check (role in ('admin','manager','designer','client')),
  account_type text not null default 'individual' check (account_type in ('individual','business')),
  avatar_url text,
  phone text, birth_date date, address text,
  company_name text, representative_name text, business_registration_number text,
  contact_name text, contact_phone text, business_address text, industry text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username)) where username is not null;
create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_role_idx on public.profiles (role);
drop trigger if exists profiles_updated on public.profiles;
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- services & options ------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null, name_en text, description text,
  category text not null default 'content',
  base_price integer not null default 0,
  default_delivery_days integer not null default 5,
  active boolean not null default true,
  featured boolean not null default false,
  badge text, icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists services_active_idx on public.services (active, sort_order);
drop trigger if exists services_updated on public.services;
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();

create table if not exists public.service_options (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  key text not null, label text not null, price integer not null default 0,
  active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists service_options_service_idx
  on public.service_options (service_id, sort_order);

-- inquiries → quotes → orders → payments → projects ----------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null, email text not null, phone text, company text,
  service_type text,
  service_id uuid references public.services(id) on delete set null,
  selected_options jsonb not null default '[]'::jsonb,
  estimated_total integer,
  budget_range text, message text,
  source text not null default 'website',
  status text not null default 'new'
    check (status in ('new','contacted','quoted','converted','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inquiries_status_idx on public.inquiries (status);
create index if not exists inquiries_user_idx on public.inquiries (user_id);
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
drop trigger if exists inquiries_updated on public.inquiries;
create trigger inquiries_updated before update on public.inquiries
  for each row execute function public.set_updated_at();

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references public.inquiries(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  service_id uuid references public.services(id) on delete set null,
  service_type text,
  base_price integer not null default 0,
  options jsonb not null default '[]'::jsonb,
  delivery_days integer not null default 5,
  subtotal integer not null default 0,
  vat integer not null default 0,
  total_price integer not null default 0,
  notes text,
  status text not null default 'draft'
    check (status in ('draft','sent','customer_review','accepted','rejected','expired')),
  sent_at timestamptz, customer_accepted_at timestamptz,
  customer_rejected_at timestamptz, expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quotes_status_idx on public.quotes (status);
create index if not exists quotes_user_idx on public.quotes (user_id);
create index if not exists quotes_inquiry_idx on public.quotes (inquiry_id);
drop trigger if exists quotes_updated on public.quotes;
create trigger quotes_updated before update on public.quotes
  for each row execute function public.set_updated_at();

create sequence if not exists public.order_seq;
create or replace function public.gen_order_no()
returns text language sql as $$
  select 'BO-' || to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD')
    || '-' || lpad(nextval('public.order_seq')::text, 4, '0')
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null default public.gen_order_no(),
  quote_id uuid references public.quotes(id) on delete set null,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text, customer_email text, customer_phone text,
  amount integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending','paid','cancelled','refunded','failed')),
  payment_provider text not null default 'payapp',
  paid_at timestamptz, cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_user_idx on public.orders (user_id);
drop trigger if exists orders_updated on public.orders;
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'payapp',
  provider_payment_no text, payment_method text,
  amount integer not null default 0,
  status text not null default 'requested'
    check (status in ('requested','approved','cancelled','failed','refunded')),
  pay_url text, raw_payload jsonb,
  requested_at timestamptz not null default now(),
  approved_at timestamptz, cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists payments_provider_no_unique
  on public.payments (provider, provider_payment_no) where provider_payment_no is not null;
create index if not exists payments_order_idx on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (status);

create sequence if not exists public.project_seq;
create or replace function public.gen_project_no()
returns text language sql as $$
  select 'BP-' || to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD')
    || '-' || lpad(nextval('public.project_seq')::text, 4, '0')
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_no text unique not null default public.gen_project_no(),
  order_id uuid references public.orders(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  client_name text not null, company text, title text not null,
  service_id uuid references public.services(id) on delete set null,
  service_type text,
  status text not null default 'queued' check (status in
    ('queued','briefing','ai_draft','designing','review','revision','delivered','completed','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  progress integer not null default 0 check (progress between 0 and 100),
  due_date date,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_user_idx on public.projects (user_id);
create index if not exists projects_assigned_idx on public.projects (assigned_to);
drop trigger if exists projects_updated on public.projects;
create trigger projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_name text not null, file_path text not null,
  file_type text, file_size integer,
  uploaded_by uuid references public.profiles(id) on delete set null,
  visibility text not null default 'internal' check (visibility in ('internal','client')),
  is_final boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists project_files_project_idx
  on public.project_files (project_id, created_at desc);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  audience text not null default 'internal' check (audience in ('internal','client','both')),
  attachments jsonb not null default '[]'::jsonb,
  read_at_by_client timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists project_messages_project_idx
  on public.project_messages (project_id, created_at desc);

create table if not exists public.revision_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requester_id uuid references public.profiles(id) on delete set null,
  title text not null, description text not null,
  status text not null default 'pending'
    check (status in ('pending','accepted','rejected','in_progress','done')),
  resolution_note text,
  responded_by uuid references public.profiles(id) on delete set null,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists revision_requests_project_idx
  on public.revision_requests (project_id, created_at desc);
drop trigger if exists revision_requests_updated on public.revision_requests;
create trigger revision_requests_updated before update on public.revision_requests
  for each row execute function public.set_updated_at();

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null, entity_id uuid, action text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip text, user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_entity_idx
  on public.activity_logs (entity_type, entity_id);
create index if not exists activity_logs_created_idx
  on public.activity_logs (created_at desc);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null, value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

-- Role helpers ------------------------------------------------
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin','manager','designer') from public.profiles where id = auth.uid()), false)
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;
create or replace function public.email_by_username(p_username text)
returns text language sql stable security definer set search_path = public as $$
  select email from public.profiles where lower(username) = lower(p_username) limit 1
$$;
revoke all on function public.current_user_role(), public.is_staff(), public.is_admin(),
  public.email_by_username(text) from public;
grant execute on function public.current_user_role(), public.is_staff(), public.is_admin(),
  public.email_by_username(text) to anon, authenticated;

-- Grants ------------------------------------------------------
grant insert on public.inquiries to anon;
grant select on public.services, public.service_options to anon, authenticated;

-- RLS (see migration applied via MCP for full policies) -------
-- (Policies are listed in the MCP-applied version. This file is a backup.)
