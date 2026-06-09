-- ============================================================
-- 0009 — inquiry status pipeline
-- ============================================================
-- Backfilled into the repo to match the live DB (already applied there as
-- `inquiry_status_pipeline_0009`). Expands public.inquiries.status to carry the
-- full lead lifecycle used by the CRM ↔ payment sync (converted → in_progress →
-- completed) in addition to the original archive states.
--
-- Idempotent + non-destructive: re-running drops and re-adds the CHECK only.
-- All existing rows already satisfy the wider set, so no data is touched.
-- ============================================================

alter table public.inquiries
  drop constraint if exists inquiries_status_check;

alter table public.inquiries
  add constraint inquiries_status_check
  check (status in (
    'new', 'contacted', 'quoted', 'converted',
    'in_progress', 'completed', 'archived'
  ));
