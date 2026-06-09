-- ============================================================
-- 0012 — inquiry files
-- ============================================================
-- Backfilled into the repo to match the live DB (already applied there as
-- `0012_inquiry_files`). Adds reference-attachment support to the public
-- inquiry form: an `inquiry_files` metadata table + a private `inquiry-files`
-- storage bucket. Uploads/reads go through server-issued signed URLs (service
-- role), so the bucket itself needs no anon object policy.
--
-- Idempotent + non-destructive; a no-op on the live DB.
-- ============================================================

create table if not exists public.inquiry_files (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  category text,
  created_at timestamptz not null default now()
);
create index if not exists inquiry_files_inquiry_idx
  on public.inquiry_files (inquiry_id, created_at desc);

alter table public.inquiry_files enable row level security;

-- Owner (the inquiry's logged-in user) may read their own files; staff all.
drop policy if exists inquiry_files_owner_read on public.inquiry_files;
create policy inquiry_files_owner_read on public.inquiry_files for select
  using (exists (
    select 1 from public.inquiries i
    where i.id = inquiry_files.inquiry_id and i.user_id = auth.uid()
  ));
drop policy if exists inquiry_files_staff_all on public.inquiry_files;
create policy inquiry_files_staff_all on public.inquiry_files for all
  using (public.is_staff()) with check (public.is_staff());

-- Private bucket, 100MB per object. Reads/writes are server-mediated via
-- signed URLs, so no storage.objects policy is granted to anon/authenticated.
insert into storage.buckets (id, name, public, file_size_limit)
values ('inquiry-files', 'inquiry-files', false, 104857600)
on conflict (id) do nothing;
