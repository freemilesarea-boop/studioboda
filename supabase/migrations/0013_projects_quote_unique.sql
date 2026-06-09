-- ============================================================
-- 0013 — one project per quote (race-safety guard)
-- ============================================================
-- ensureProjectForQuote() enforces a 1:1 quote→project mapping in application
-- code (select-before-insert). This partial unique index is the database-level
-- backstop against a concurrent double-insert (e.g. webhook + reconcile firing
-- together). NULL quote_id rows (ad-hoc projects) are unaffected.
--
-- Safe to apply: the projects table currently holds no duplicate quote_id rows.
-- Idempotent via IF NOT EXISTS.
-- ============================================================

create unique index if not exists projects_quote_id_uniq
  on public.projects (quote_id)
  where quote_id is not null;
