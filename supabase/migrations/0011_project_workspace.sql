-- ============================================================
-- 0011 — project workspace
-- ============================================================
-- Backfilled into the repo to match the live DB (already applied there as
-- `0011_project_workspace`). Adds the customer-facing project workspace:
--   • project_briefs        — the client brief form (1 per project)
--   • project_deliverables  — versioned final outputs (산출물)
--   • project_read_state    — per-user last-read marker (unread badges)
--   • revision_requests     — reshaped from the dormant 0002 table into the
--                             workspace 수정요청 model (content/priority/admin_note)
--   • project_files         — client (을) read/insert/delete RLS + a storage
--                             read policy so clients can fetch their own files
--
-- Everything is idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS /
-- DROP POLICY IF EXISTS) and safe to re-run; on the live DB it is a no-op.
-- No payment/contract data is touched.
-- ============================================================

-- The default organization (스튜디오 보다) — matches live column defaults.
-- ── project_briefs ──────────────────────────────────────────
create table if not exists public.project_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid default 'bdb4273f-aa49-4eab-b860-8ae33e1e8e1d'::uuid,
  company_name text,
  manager_name text,
  contact_phone text,
  contact_email text,
  production_type text,
  purpose text,
  target_audience text,
  desired_mood text,
  reference_urls text,
  competitor_urls text,
  must_requirements text,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists project_briefs_project_id_key
  on public.project_briefs (project_id);
drop trigger if exists set_updated_at on public.project_briefs;
create trigger set_updated_at before update on public.project_briefs
  for each row execute function public.set_updated_at();

-- ── project_deliverables ────────────────────────────────────
create table if not exists public.project_deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null default 1,
  title text not null,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  notes text,
  is_latest boolean not null default true,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists project_deliverables_project_idx
  on public.project_deliverables (project_id, version desc);

-- ── project_read_state ──────────────────────────────────────
create table if not exists public.project_read_state (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- ── revision_requests reshape (from dormant 0002 shape) ─────
-- The 0002 table was never used; reshape it into the workspace model. Guarded
-- so it is a no-op on the live DB (columns/constraints already in final form).
alter table public.revision_requests add column if not exists content text;
do $$
begin
  -- Carry any legacy `description` text over to `content` before it is dropped.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'revision_requests'
      and column_name = 'description'
  ) then
    update public.revision_requests set content = coalesce(content, description)
      where content is null;
  end if;
end $$;
alter table public.revision_requests add column if not exists priority text not null default 'normal';
alter table public.revision_requests add column if not exists admin_note text;
-- Drop the legacy columns (table is empty in both fresh + live DBs).
alter table public.revision_requests drop column if exists description;
alter table public.revision_requests drop column if exists resolution_note;
alter table public.revision_requests drop column if exists responded_by;
-- content is required once backfilled.
do $$
begin
  if not exists (select 1 from public.revision_requests where content is null) then
    execute 'alter table public.revision_requests alter column content set not null';
  end if;
end $$;
-- status: requested → reviewing → in_progress → done
alter table public.revision_requests alter column status set default 'requested';
alter table public.revision_requests drop constraint if exists revision_requests_status_check;
alter table public.revision_requests add constraint revision_requests_status_check
  check (status in ('requested', 'reviewing', 'in_progress', 'done'));
-- priority: low | normal | high
alter table public.revision_requests drop constraint if exists revision_requests_priority_check;
alter table public.revision_requests add constraint revision_requests_priority_check
  check (priority in ('low', 'normal', 'high'));
-- converge the updated_at trigger name to set_updated_at
drop trigger if exists revision_requests_updated on public.revision_requests;
drop trigger if exists set_updated_at on public.revision_requests;
create trigger set_updated_at before update on public.revision_requests
  for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
alter table public.project_briefs enable row level security;
alter table public.project_deliverables enable row level security;
alter table public.project_read_state enable row level security;
alter table public.revision_requests enable row level security;

-- project_briefs: owner (project user) full access to their brief; staff all
drop policy if exists project_briefs_owner_all on public.project_briefs;
create policy project_briefs_owner_all on public.project_briefs for all
  using (exists (
    select 1 from public.projects p
    where p.id = project_briefs.project_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = project_briefs.project_id and p.user_id = auth.uid()
  ));
drop policy if exists project_briefs_staff_all on public.project_briefs;
create policy project_briefs_staff_all on public.project_briefs for all
  using (public.is_staff()) with check (public.is_staff());

-- project_deliverables: owner read (client-visible), staff write
drop policy if exists project_deliverables_owner_read on public.project_deliverables;
create policy project_deliverables_owner_read on public.project_deliverables for select
  using (public.is_staff() or exists (
    select 1 from public.projects p
    where p.id = project_deliverables.project_id and p.user_id = auth.uid()
  ));
drop policy if exists project_deliverables_staff_write on public.project_deliverables;
create policy project_deliverables_staff_write on public.project_deliverables for all
  using (public.is_staff()) with check (public.is_staff());

-- project_read_state: each user manages their own marker; staff all
drop policy if exists project_read_state_owner_all on public.project_read_state;
create policy project_read_state_owner_all on public.project_read_state for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists project_read_state_staff_all on public.project_read_state;
create policy project_read_state_staff_all on public.project_read_state for all
  using (public.is_staff()) with check (public.is_staff());

-- revision_requests: owner insert + read (own project), staff all
drop policy if exists revision_requests_owner_insert on public.revision_requests;
create policy revision_requests_owner_insert on public.revision_requests for insert
  with check (requester_id = auth.uid() and exists (
    select 1 from public.projects p
    where p.id = revision_requests.project_id and p.user_id = auth.uid()
  ));
drop policy if exists revision_requests_owner_read on public.revision_requests;
create policy revision_requests_owner_read on public.revision_requests for select
  using (exists (
    select 1 from public.projects p
    where p.id = revision_requests.project_id and p.user_id = auth.uid()
  ));
drop policy if exists revision_requests_staff_all on public.revision_requests;
create policy revision_requests_staff_all on public.revision_requests for all
  using (public.is_staff()) with check (public.is_staff());

-- ── project_files: client (을) self-service RLS ─────────────
-- Clients may read their client-visible files, upload client files to their
-- own project, and delete their own non-final uploads. Staff policies remain
-- as defined in earlier migrations.
drop policy if exists project_files_owner_read on public.project_files;
create policy project_files_owner_read on public.project_files for select
  using (public.is_staff() or (
    visibility = 'client' and exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.user_id = auth.uid()
    )
  ));
drop policy if exists project_files_owner_insert on public.project_files;
create policy project_files_owner_insert on public.project_files for insert
  with check (visibility = 'client' and uploaded_by = auth.uid() and exists (
    select 1 from public.projects p
    where p.id = project_files.project_id and p.user_id = auth.uid()
  ));
drop policy if exists project_files_owner_delete on public.project_files;
create policy project_files_owner_delete on public.project_files for delete
  using (uploaded_by = auth.uid() and is_final = false and exists (
    select 1 from public.projects p
    where p.id = project_files.project_id and p.user_id = auth.uid()
  ));

-- storage: clients may read objects in project-files that belong to their
-- project and are client-visible (signed-URL issuance still goes through the
-- server, but this keeps the bucket least-privilege).
drop policy if exists project_files_owner_read on storage.objects;
create policy project_files_owner_read on storage.objects for select
  using (bucket_id = 'project-files' and exists (
    select 1 from public.project_files pf
    join public.projects p on p.id = pf.project_id
    where pf.file_path = storage.objects.name
      and pf.visibility = 'client'
      and p.user_id = auth.uid()
  ));
