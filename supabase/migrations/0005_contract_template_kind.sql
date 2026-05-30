-- ============================================================
-- STUDIO BODA · contracts.template_kind
-- ============================================================
-- Adds the contract template type so the rendered legal body is reproducible
-- and the admin can switch between 단건 웹사이트 / 상세페이지 / 유지보수·구독
-- templates. Additive + idempotent.
-- ============================================================

alter table public.contracts
  add column if not exists template_kind text not null default 'detail_page';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contracts_template_kind_check'
  ) then
    alter table public.contracts
      add constraint contracts_template_kind_check
      check (template_kind in ('website','detail_page','maintenance'));
  end if;
end $$;
