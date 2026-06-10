-- ============================================================
-- 0012 — 브리프 참고 첨부파일
-- 텍스트 위주였던 project_briefs 에 참고 이미지/문서를 직접 첨부할 수
-- 있도록 attachments(jsonb) 컬럼을 추가한다. 표시 레이어 보강이며 결제·
-- 계약 데이터와 무관하다. IF NOT EXISTS 로 멱등하게 작성되어 재실행해도
-- 안전(라이브 DB 에서는 no-op).
-- ============================================================

alter table public.project_briefs
  add column if not exists attachments jsonb not null default '[]'::jsonb;
