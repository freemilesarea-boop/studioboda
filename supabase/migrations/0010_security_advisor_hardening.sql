-- ============================================================
-- 0010 — security advisor hardening
-- ============================================================
-- Backfilled into the repo to match the live DB (already applied there as
-- `security_advisor_hardening_0010`). Pins an explicit search_path on the
-- SECURITY DEFINER / trigger helper functions so they cannot be hijacked via a
-- mutable search_path (Supabase security-advisor: function_search_path_mutable).
--
-- Idempotent + non-destructive: ALTER FUNCTION ... SET search_path is a no-op
-- when already set, and each statement is guarded by an existence check so a
-- fresh DB that has not yet defined a given function does not error.
-- ============================================================

do $$
begin
  if to_regprocedure('public.is_staff()') is not null then
    execute 'alter function public.is_staff() set search_path = public';
  end if;
  if to_regprocedure('public.is_admin()') is not null then
    execute 'alter function public.is_admin() set search_path = public';
  end if;
  if to_regprocedure('public.handle_new_user()') is not null then
    execute 'alter function public.handle_new_user() set search_path = public';
  end if;
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'alter function public.set_updated_at() set search_path = public';
  end if;
  if to_regprocedure('public.gen_project_no()') is not null then
    execute 'alter function public.gen_project_no() set search_path = public, pg_temp';
  end if;
end $$;
