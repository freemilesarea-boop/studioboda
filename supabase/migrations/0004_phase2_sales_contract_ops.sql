-- ============================================================
-- STUDIO BODA · Phase 2 — Sales / Contract / Operations system
-- ============================================================
-- Extends the existing 문의→견적→결제→프로젝트 pipeline into
-- 문의→상담→견적→계약→결제→프로젝트→재구매 by adding:
--   contracts, contract_versions        (전자 계약서 + 버전 관리)
--   crm_activities + inquiries.lead_status (CRM 파이프라인)
--   case_studies, case_study_sections   (성공사례)
--   reviews                              (후기 + 승인)
--   faq_categories, faq_items            (FAQ)
--
-- Conventions: reuses public.set_updated_at(), public.is_staff(),
-- public.is_admin() from earlier migrations. Idempotent (if not exists /
-- drop ... if exists). Soft delete via `deleted_at`. No existing object is
-- dropped or altered destructively.
-- ============================================================

create extension if not exists pgcrypto with schema public;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin','manager','designer') from public.profiles where id = auth.uid()), false)
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- ============================================================
-- CRM: lead pipeline on inquiries (additive — existing `status` untouched)
-- ============================================================
alter table public.inquiries
  add column if not exists lead_status text not null default 'new';
alter table public.inquiries
  add column if not exists estimated_amount integer;
alter table public.inquiries
  add column if not exists last_activity_at timestamptz;
alter table public.inquiries
  add column if not exists deleted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'inquiries_lead_status_check'
  ) then
    alter table public.inquiries
      add constraint inquiries_lead_status_check check (lead_status in (
        'new','contacted','meeting','quoted','contract_sent',
        'contract_signed','paid','in_progress','completed','lost'
      ));
  end if;
end $$;
create index if not exists inquiries_lead_status_idx
  on public.inquiries (lead_status) where deleted_at is null;

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null default 'note'
    check (type in ('note','status_change','call','meeting','email','quote','contract','payment','system')),
  from_status text,
  to_status text,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists crm_activities_inquiry_idx
  on public.crm_activities (inquiry_id, created_at desc);

-- ============================================================
-- contracts + contract_versions
-- ============================================================
create sequence if not exists public.contract_seq;
create or replace function public.gen_contract_no()
returns text language sql as $$
  select 'BC-' || to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD')
    || '-' || lpad(nextval('public.contract_seq')::text, 4, '0')
$$;

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number text unique not null default public.gen_contract_no(),
  quote_id uuid references public.quotes(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  title text not null default '서비스 제작 계약서',
  body text,
  amount integer not null default 0,
  status text not null default 'draft'
    check (status in ('draft','sent','viewed','signed','expired','cancelled')),
  pdf_url text,
  client_signature text,
  admin_signature text,
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  admin_signed_at timestamptz,
  expires_at timestamptz,
  current_version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contracts_client_idx on public.contracts (client_id) where deleted_at is null;
create index if not exists contracts_quote_idx on public.contracts (quote_id);
create index if not exists contracts_status_idx on public.contracts (status) where deleted_at is null;
drop trigger if exists contracts_updated on public.contracts;
create trigger contracts_updated before update on public.contracts
  for each row execute function public.set_updated_at();

create table if not exists public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  version integer not null,
  title text,
  body text,
  amount integer,
  pdf_url text,
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (contract_id, version)
);
create index if not exists contract_versions_contract_idx
  on public.contract_versions (contract_id, version desc);

-- ============================================================
-- case_studies + case_study_sections
-- ============================================================
create table if not exists public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  client_name text,
  service_type text,
  category text,
  summary text,
  problem text,
  solution text,
  result_summary text,
  tech_stack jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '[]'::jsonb,
  thumbnail_url text,
  cover_url text,
  portfolio_item_id uuid references public.portfolio_items(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists case_studies_published_idx
  on public.case_studies (status, is_featured desc, sort_order, published_at desc)
  where deleted_at is null;
create index if not exists case_studies_slug_idx on public.case_studies (slug);
drop trigger if exists case_studies_updated on public.case_studies;
create trigger case_studies_updated before update on public.case_studies
  for each row execute function public.set_updated_at();

create table if not exists public.case_study_sections (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  kind text not null default 'custom'
    check (kind in ('overview','problem','solution','process','result','tech','custom')),
  heading text,
  body text,
  media jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists case_study_sections_parent_idx
  on public.case_study_sections (case_study_id, sort_order);
drop trigger if exists case_study_sections_updated on public.case_study_sections;
create trigger case_study_sections_updated before update on public.case_study_sections
  for each row execute function public.set_updated_at();

-- ============================================================
-- reviews
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  author_name text,
  company text,
  rating integer not null default 5 check (rating between 1 and 5),
  title text,
  body text not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','hidden')),
  is_featured boolean not null default false,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_status_idx
  on public.reviews (status, created_at desc) where deleted_at is null;
create index if not exists reviews_author_idx on public.reviews (author_id);
drop trigger if exists reviews_updated on public.reviews;
create trigger reviews_updated before update on public.reviews
  for each row execute function public.set_updated_at();

-- ============================================================
-- faq_categories + faq_items
-- ============================================================
create table if not exists public.faq_categories (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists faq_categories_updated on public.faq_categories;
create trigger faq_categories_updated before update on public.faq_categories
  for each row execute function public.set_updated_at();

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.faq_categories(id) on delete set null,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists faq_items_category_idx
  on public.faq_items (category_id, sort_order) where deleted_at is null;
drop trigger if exists faq_items_updated on public.faq_items;
create trigger faq_items_updated before update on public.faq_items
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security (defense-in-depth; app uses service role server-side)
-- ============================================================
alter table public.crm_activities       enable row level security;
alter table public.contracts            enable row level security;
alter table public.contract_versions    enable row level security;
alter table public.case_studies         enable row level security;
alter table public.case_study_sections  enable row level security;
alter table public.reviews              enable row level security;
alter table public.faq_categories       enable row level security;
alter table public.faq_items            enable row level security;

-- crm_activities: staff only
drop policy if exists crm_activities_staff_all on public.crm_activities;
create policy crm_activities_staff_all on public.crm_activities
  for all using (public.is_staff()) with check (public.is_staff());

-- contracts: client reads own (non-deleted), staff manage
drop policy if exists contracts_owner_read on public.contracts;
create policy contracts_owner_read on public.contracts
  for select using (client_id = auth.uid() and deleted_at is null);
drop policy if exists contracts_staff_all on public.contracts;
create policy contracts_staff_all on public.contracts
  for all using (public.is_staff()) with check (public.is_staff());

-- contract_versions: client reads versions of own contracts, staff manage
drop policy if exists contract_versions_owner_read on public.contract_versions;
create policy contract_versions_owner_read on public.contract_versions
  for select using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.client_id = auth.uid() and c.deleted_at is null
    )
  );
drop policy if exists contract_versions_staff_all on public.contract_versions;
create policy contract_versions_staff_all on public.contract_versions
  for all using (public.is_staff()) with check (public.is_staff());

-- case_studies / sections: public reads published (non-deleted), staff manage
drop policy if exists case_studies_public_read on public.case_studies;
create policy case_studies_public_read on public.case_studies
  for select using ((status = 'published' and deleted_at is null) or public.is_staff());
drop policy if exists case_studies_staff_all on public.case_studies;
create policy case_studies_staff_all on public.case_studies
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists case_study_sections_public_read on public.case_study_sections;
create policy case_study_sections_public_read on public.case_study_sections
  for select using (
    public.is_staff() or exists (
      select 1 from public.case_studies cs
      where cs.id = case_study_id and cs.status = 'published' and cs.deleted_at is null
    )
  );
drop policy if exists case_study_sections_staff_all on public.case_study_sections;
create policy case_study_sections_staff_all on public.case_study_sections
  for all using (public.is_staff()) with check (public.is_staff());

-- reviews: public reads approved; author reads/creates own; staff manage
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select using (
    (status = 'approved' and deleted_at is null)
    or author_id = auth.uid()
    or public.is_staff()
  );
drop policy if exists reviews_author_insert on public.reviews;
create policy reviews_author_insert on public.reviews
  for insert with check (author_id = auth.uid() and status = 'pending');
drop policy if exists reviews_staff_all on public.reviews;
create policy reviews_staff_all on public.reviews
  for all using (public.is_staff()) with check (public.is_staff());

-- faq: public reads active; staff manage
drop policy if exists faq_categories_public_read on public.faq_categories;
create policy faq_categories_public_read on public.faq_categories
  for select using (active = true or public.is_staff());
drop policy if exists faq_categories_staff_all on public.faq_categories;
create policy faq_categories_staff_all on public.faq_categories
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists faq_items_public_read on public.faq_items;
create policy faq_items_public_read on public.faq_items
  for select using ((active = true and deleted_at is null) or public.is_staff());
drop policy if exists faq_items_staff_all on public.faq_items;
create policy faq_items_staff_all on public.faq_items
  for all using (public.is_staff()) with check (public.is_staff());

-- ============================================================
-- Grants (least privilege; service role bypasses all of this)
-- ============================================================
grant select on public.case_studies, public.case_study_sections to anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;
grant select on public.faq_categories, public.faq_items to anon, authenticated;
grant select on public.contracts, public.contract_versions to authenticated;

-- ============================================================
-- Seed: default FAQ categories (only when none exist)
-- ============================================================
insert into public.faq_categories (key, name, sort_order)
select * from (values
  ('website', '웹사이트', 1),
  ('shop', '쇼핑몰', 2),
  ('maintenance', '유지보수', 3),
  ('contract', '계약', 4),
  ('payment', '결제', 5)
) as v(key, name, sort_order)
where not exists (select 1 from public.faq_categories);
