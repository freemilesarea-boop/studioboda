# PayApp Webhook / Reconcile 아키텍처

> STUDIO BODA 결제 완료(웹훅) 자동 반영 구조. **장애 시 이 문서의 "장애 시 확인 순서"부터 보세요.**
> 최종 업데이트: 2026-06-09 (Phase F1).

---

## 1. 전체 흐름도

```
[고객 결제 (PayApp 결제창)]
        │
        │  PayApp 가맹점 공통 알림 URL (feedbackurl, 가맹점 단위 고정)
        │  ※ 우리 코드는 결제요청 시 feedbackurl을 per-request로 설정하지 않음
        ▼
┌────────────────────────────────────────────────────────────┐
│  Supabase Edge Function: payapp-webhook (v38)                │  ← ⚠️ 외부/별도 프로젝트
│  project = tyrhbiwvwmdybwaydvto ("louver-ai-platform")      │
│  - PAYAPP_LINK_KEY / PAYAPP_LINK_VALUE 로 1차 검증            │
│  - var1 값으로 사이트 라우팅                                 │
│    · var1 = 'studioboda' | 'studioboda_payment' → forward    │
│    · 그 외(UUID) → louver 자체 subscription_orders 처리       │
│  - forward 대상 = STUDIOBODA_WEBHOOK_URL (apex→www 정규화)    │
│  - payment_logs(event_type='studioboda_forwarded')에 기록     │
└────────────────────────────────────────────────────────────┘
        │  POST application/x-www-form-urlencoded, redirect:'manual'
        ▼
┌────────────────────────────────────────────────────────────┐
│  Vercel endpoint                                            │
│  POST https://www.studioboda.co.kr/api/payapp/webhook       │
│  (= app/api/payapp/webhook/route.ts, 이 레포)                │
│  - verifyAndParseWebhook: linkval/linkkey 검증               │
│  - ref = var2 || shop_user_id = payments.id                 │
│  - mul_no / amount 일치 검사 + 멱등                          │
│  - payments 갱신 + side-effects                             │
│  - syncQuotePaymentState (원장 단일소스 동기화)              │
│  - "SUCCESS" 응답 (PayApp가 요구하는 리터럴)                 │
└────────────────────────────────────────────────────────────┘
        │ (웹훅 누락/실패 시)
        ▼
┌────────────────────────────────────────────────────────────┐
│  안전망: Vercel Cron /api/cron/reconcile-payments (매시)     │
│  - pending 결제를 PayApp paycheck로 재조회 → paid 반영        │
│  - 최근 paid 결제 재검증 → 취소/환불이면 refunded 역전        │
└────────────────────────────────────────────────────────────┘
```

---

## 2. PayApp 공통 알림 URL 구조

- PayApp 가맹점(shop)은 **하나의 feedbackurl(알림 URL)**만 갖고, 그 URL이 위 Edge Function(`payapp-webhook`)을 가리킨다.
- 동일 가맹점을 **3개 사이트가 공유**한다: STUDIO BODA, (program), (ebook). 같은 가맹점의 다른 결제 함수: `payapp-program-webhook`, `payapp-ebook-webhook`.
- 따라서 STUDIO BODA 결제는 **반드시 `var1`로 자기 사이트를 표시**해야 라우팅된다.

## 3. var1 라우팅 구조

| var1 값 | 처리 |
|---|---|
| `studioboda` 또는 `studioboda_payment` | STUDIO BODA Vercel 엔드포인트로 forward |
| UUID (subscription order id) | louver-ai-platform 자체 구독 처리 (state 4/64/128/99) |
| `ebook` (var2) | 무시(SUCCESS) |

- 우리 결제 생성 코드(`lib/payments/providers/payapp.ts`)는 결제요청 시 **`var1='studioboda'`**, **`var2=payments.id`**를 항상 세팅한다.

## 4. var2 / payment id 매핑 구조

- 결제 생성 시: `shop_user_id = var2 = payments.id` (우리 DB의 결제행 UUID).
- 웹훅 수신 시: `ref = var2 || shop_user_id` → 이 UUID로 `payments` 행을 찾는다.
- `mul_no` = PayApp 거래번호(`payapp_mul_no`). 최초 결제요청 응답에서 받아 `payments.payapp_mul_no`에 저장하고, 이후 웹훅의 mul_no와 **일치해야** 처리한다.

## 5. Vercel endpoint & 검증 방식

엔드포인트: `POST https://www.studioboda.co.kr/api/payapp/webhook` (`app/api/payapp/webhook/route.ts`)

검증/안전장치 (순서대로):
1. **서명 검증** — `linkval == PAYAPP_LINKVAL` && (`linkkey` 있으면 `== PAYAPP_LINKKEY`). 불일치 → `401 INVALID_SIGNATURE`.
2. **ref 존재** — var2/shop_user_id 없으면 `400 MISSING_REF`.
3. **payments 조회** — 없으면 `404 PAYMENT_NOT_FOUND`.
4. **mul_no 일치** — 기존 바인딩과 다르면 `400 MUL_NO_MISMATCH` + 로그.
5. **amount 일치** — `price != payments.amount` 면 `400 AMOUNT_MISMATCH` + 로그(변조 방지).
6. **멱등** — 이미 같은 종결 상태면 그대로 `SUCCESS`.
7. 상태 전이(paid/cancelled/failed) + side-effects + `syncQuotePaymentState` + `syncInquiryPipelineForQuote`.

> 참고: 결제요청 응답 검증(state==1)과 paycheck 재조회도 동일 `payappEnv()`(SHOP_ID/API_KEY/LINKKEY/LINKVAL)를 사용.

## 6. 실패 시 fallback (reconcile)

- **Vercel Cron**: `vercel.json` → `/api/cron/reconcile-payments` **매시 정각**(`0 * * * *`), `/api/cron/ops` 매일 09:00 KST. 인증 = `CRON_SECRET` Bearer.
- `reconcilePendingPaymentsCore()`:
  - **1차**: `status='pending'` + `payapp_mul_no` 있는 결제 → PayApp `paycheck` 재조회 → paid면 `applyPaidSideEffects`(웹훅과 동일 side-effect), cancelled/failed면 상태 갱신. 금액 불일치 시 보류+로그.
  - **2차(환불 감지)**: 최근 `paid` 결제 재조회 → PayApp이 취소/환불이면 `refunded` + `syncQuotePaymentState`로 quote/project 역전.
- **복구 시간**: 웹훅 누락 시 **최대 약 1시간 내 자동 반영**.

## 7. 로그 확인 위치

| 위치 | 무엇 |
|---|---|
| `tyrhbiwvwmdybwaydvto.payment_logs` | Edge Function 수신/forward 결과(`studioboda_forwarded`, `error_message=forward status=...`), 검증 실패 |
| 해당 프로젝트 Edge Function 로그 | `[PayApp Router] forward → ... status=...` |
| STUDIO BODA `activity_logs` | `webhook_paid` / `webhook_failed` / `webhook_unknown` / `webhook_amount_mismatch` / `webhook_mul_no_mismatch` / `cron_reconcile_applied` / `webhook_paid_reconciled` / `payment_state_reversed` |
| Vercel runtime logs (이 프로젝트) | `[email] ...`, 라우트 에러, webhook 처리 |
| STUDIO BODA `notification_deliveries` | 알림 채널별 발송 결과(email/kakao) |
| **관리자 화면** | `/admin/payments` 상단 **"결제 운영 상태"** 위젯 (Phase F3) |

## 8. 장애 시 확인 순서 (결제했는데 미반영)

1. **관리자 `/admin/payments` "결제 운영 상태" 위젯** 확인 — 최근 webhook/불일치/pending aging.
2. 해당 결제행: `payments.status`, `payapp_mul_no` 존재 여부.
3. **Edge Function 쪽** `payment_logs`(louver 프로젝트)에 `studioboda_forwarded` 기록 + `error_message`(forward status) 확인 → forward 자체가 실패했는지.
4. STUDIO BODA `activity_logs`에 `webhook_*` 기록 유무 → Vercel 도달 여부.
5. 도달했는데 미반영이면 mul_no/amount mismatch 로그 확인.
6. **즉시 복구**: `/admin/payments`의 **"결제 동기화"(ReconcileButton)** 실행 → PayApp 재조회로 강제 반영. (또는 매시 크론 대기)
7. 그래도 안 되면: Edge Function `STUDIOBODA_WEBHOOK_URL` 시크릿/배포 상태, PayApp 가맹점 알림 URL 점검.

## 9. 운영자가 절대 건드리면 안 되는 설정

- ❌ **PayApp 가맹점 알림(feedbackurl) URL** — 공유 가맹점이라 바꾸면 program/ebook까지 깨진다.
- ❌ **Edge Function `payapp-webhook` (louver-ai-platform)** 의 `STUDIOBODA_WEBHOOK_URL`, `PAYAPP_LINK_KEY/VALUE` — apex→www 정규화 로직 포함. v38 미만으로 롤백 금지.
- ❌ **Vercel 도메인 리다이렉트** — apex `studioboda.co.kr`는 www로 307. forward는 항상 `www`로 가야 POST body 보존.
- ❌ **Vercel env**: `PAYAPP_SHOP_ID/API_KEY/LINKKEY/LINKVAL`, `CRON_SECRET` — 누락 시 검증/크론 비활성.
- ⚠️ Edge Function의 `verifyPayAppRequest`는 LINK_KEY/VALUE **미설정 시 true(전체 허용)** 로 동작 → 그 시크릿은 반드시 설정 유지.

---

## 10. 외부 Edge Function 소스 백업

- 본 함수는 **이 레포의 Supabase 프로젝트가 아님**(louver-ai-platform 소속). 이 레포에서 배포/버전관리 불가.
- 읽기 전용 백업: [`supabase/functions/payapp-webhook-backup/index.ts`](../supabase/functions/payapp-webhook-backup/index.ts) (v38 캡처, **배포 금지**).
- 실제 수정/복원은 louver-ai-platform 프로젝트에서 `supabase functions deploy payapp-webhook` 로 수행.
- 권장(F1 후속): 해당 함수를 louver 레포의 정식 소스로 버전관리 + forward 실패 알림 추가.
