-- STUDIO BODA admin system schema
-- All tables isolated in `boda` schema to avoid conflicts with existing public app
-- After applying, you must also expose `boda` to PostgREST. From a privileged
-- SQL editor in your Supabase project, run once:
--
--   alter role authenticator set pgrst.db_schemas = 'public,boda,graphql_public';
--   notify pgrst, 'reload config';

create schema if not exists boda;
create extension if not exists pgcrypto with schema public;

-- 1. profiles
create table if not exists boda.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'client' check (role in ('admin','manager','designer','client')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on boda.profiles(role);

-- 2. inquiries
create table if not exists boda.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company text,
  service_type text,
  budget_range text,
  message text,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new','contacted','quoted','converted','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inquiries_status_idx on boda.inquiries(status);
create index if not exists inquiries_created_at_idx on boda.inquiries(created_at desc);

-- 3. quotes
create table if not exists boda.quotes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references boda.inquiries(id) on delete set null,
  title text not null,
  service_type text,
  base_price integer not null default 0,
  options jsonb not null default '[]'::jsonb,
  delivery_days integer not null default 5,
  total_price integer not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quotes_status_idx on boda.quotes(status);
create index if not exists quotes_inquiry_id_idx on boda.quotes(inquiry_id);

-- 4. projects
create table if not exists boda.projects (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references boda.quotes(id) on delete set null,
  inquiry_id uuid references boda.inquiries(id) on delete set null,
  client_name text not null,
  company text,
  title text not null,
  service_type text,
  status text not null default 'queued' check (status in ('queued','briefing','ai_draft','designing','review','revision','delivered','completed','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  progress integer not null default 0 check (progress between 0 and 100),
  due_date date,
  assigned_to uuid references boda.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_status_idx on boda.projects(status);
create index if not exists projects_assigned_to_idx on boda.projects(assigned_to);

-- 5. project_files
create table if not exists boda.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references boda.projects(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size integer,
  uploaded_by uuid references boda.profiles(id) on delete set null,
  visibility text not null default 'internal' check (visibility in ('internal','client')),
  created_at timestamptz not null default now()
);
create index if not exists project_files_project_id_idx on boda.project_files(project_id);

-- 6. project_comments
create table if not exists boda.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references boda.projects(id) on delete cascade,
  author_id uuid references boda.profiles(id) on delete set null,
  body text not null,
  is_internal boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists project_comments_project_id_idx on boda.project_comments(project_id, created_at desc);

-- 7. activity_logs
create table if not exists boda.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references boda.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_entity_idx on boda.activity_logs(entity_type, entity_id);
create index if not exists activity_logs_created_at_idx on boda.activity_logs(created_at desc);

-- 8. settings
create table if not exists boda.settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function boda.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated on boda.profiles;
create trigger profiles_updated before update on boda.profiles for each row execute function boda.set_updated_at();
drop trigger if exists inquiries_updated on boda.inquiries;
create trigger inquiries_updated before update on boda.inquiries for each row execute function boda.set_updated_at();
drop trigger if exists quotes_updated on boda.quotes;
create trigger quotes_updated before update on boda.quotes for each row execute function boda.set_updated_at();
drop trigger if exists projects_updated on boda.projects;
create trigger projects_updated before update on boda.projects for each row execute function boda.set_updated_at();

-- Role helpers (SECURITY DEFINER for safe use inside RLS)
create or replace function boda.current_role()
returns text language sql stable security definer set search_path = boda, public as $$
  select role from boda.profiles where id = auth.uid()
$$;

create or replace function boda.is_staff()
returns boolean language sql stable security definer set search_path = boda, public as $$
  select coalesce((select role in ('admin','manager','designer') from boda.profiles where id = auth.uid()), false)
$$;

create or replace function boda.is_admin()
returns boolean language sql stable security definer set search_path = boda, public as $$
  select coalesce((select role = 'admin' from boda.profiles where id = auth.uid()), false)
$$;

revoke all on function boda.current_role(), boda.is_staff(), boda.is_admin() from public;
grant execute on function boda.current_role(), boda.is_staff(), boda.is_admin() to anon, authenticated;

-- Grants
grant usage on schema boda to anon, authenticated, service_role;
grant all on all tables in schema boda to service_role;
grant all on all sequences in schema boda to service_role;
grant select, insert, update on all tables in schema boda to authenticated;
grant insert on boda.inquiries to anon;

alter default privileges in schema boda grant all on tables to service_role;
alter default privileges in schema boda grant all on sequences to service_role;

-- RLS
alter table boda.profiles enable row level security;
alter table boda.inquiries enable row level security;
alter table boda.quotes enable row level security;
alter table boda.projects enable row level security;
alter table boda.project_files enable row level security;
alter table boda.project_comments enable row level security;
alter table boda.activity_logs enable row level security;
alter table boda.settings enable row level security;

drop policy if exists profiles_self_read on boda.profiles;
create policy profiles_self_read on boda.profiles for select using (auth.uid() = id or boda.is_staff());
drop policy if exists profiles_self_update on boda.profiles;
create policy profiles_self_update on boda.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_admin_all on boda.profiles;
create policy profiles_admin_all on boda.profiles for all using (boda.is_admin()) with check (boda.is_admin());

drop policy if exists inquiries_public_insert on boda.inquiries;
create policy inquiries_public_insert on boda.inquiries for insert with check (true);
drop policy if exists inquiries_staff_read on boda.inquiries;
create policy inquiries_staff_read on boda.inquiries for select using (boda.is_staff());
drop policy if exists inquiries_staff_write on boda.inquiries;
create policy inquiries_staff_write on boda.inquiries for update using (boda.is_staff()) with check (boda.is_staff());
drop policy if exists inquiries_admin_delete on boda.inquiries;
create policy inquiries_admin_delete on boda.inquiries for delete using (boda.is_admin());

drop policy if exists quotes_staff_all on boda.quotes;
create policy quotes_staff_all on boda.quotes for all using (boda.is_staff()) with check (boda.is_staff());

drop policy if exists projects_staff_all on boda.projects;
create policy projects_staff_all on boda.projects for all using (boda.is_staff()) with check (boda.is_staff());

drop policy if exists project_files_staff_all on boda.project_files;
create policy project_files_staff_all on boda.project_files for all using (boda.is_staff()) with check (boda.is_staff());

drop policy if exists project_comments_staff_all on boda.project_comments;
create policy project_comments_staff_all on boda.project_comments for all using (boda.is_staff()) with check (boda.is_staff());

drop policy if exists activity_logs_staff_read on boda.activity_logs;
create policy activity_logs_staff_read on boda.activity_logs for select using (boda.is_staff());
drop policy if exists activity_logs_staff_insert on boda.activity_logs;
create policy activity_logs_staff_insert on boda.activity_logs for insert with check (boda.is_staff() or auth.uid() is null);

drop policy if exists settings_staff_read on boda.settings;
create policy settings_staff_read on boda.settings for select using (boda.is_staff());
drop policy if exists settings_admin_write on boda.settings;
create policy settings_admin_write on boda.settings for all using (boda.is_admin()) with check (boda.is_admin());

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('boda-project-files', 'boda-project-files', false)
on conflict (id) do nothing;

drop policy if exists boda_project_files_staff_all on storage.objects;
create policy boda_project_files_staff_all on storage.objects
  for all using (bucket_id = 'boda-project-files' and boda.is_staff())
  with check (bucket_id = 'boda-project-files' and boda.is_staff());
