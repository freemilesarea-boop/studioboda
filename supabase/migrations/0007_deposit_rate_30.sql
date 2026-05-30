-- ============================================================
-- STUDIO BODA · 예약금 비율 10% → 30%
-- ============================================================
-- Default deposit split changes to 예약금 30% / 잔금 70%. New quotes created
-- without an explicit deposit_rate now default to 30 at the DB level too
-- (app also sets it explicitly on creation). Existing quotes keep their stored
-- deposit_rate so in-flight deals are not altered. Idempotent.
-- ============================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quotes'
      and column_name = 'deposit_rate'
  ) then
    alter table public.quotes alter column deposit_rate set default 30;
  end if;
end $$;
