// ============================================================
// STUDIO BODA — Notification metadata registry (single source of truth)
// ============================================================
// Every notification type maps to its presentation (icon/tone/label),
// a customer-facing summary, a deep link, and (optionally) a Kakao Alimtalk
// template code. The header dropdown, /me/notifications, the main-page banner,
// and the multi-channel dispatcher all read from here.
// ============================================================

import type { NotificationType } from "@/lib/notifications";

export type NotificationMeta = {
  icon: string;
  tone: string;
  label: string;
  /** Build the in-app summary line from the notification payload. */
  summary: (p: Record<string, unknown>) => string;
  /** Build the deep link from the payload. */
  hrefFor: (p: Record<string, unknown>) => string;
  /** Kakao Alimtalk template code (null = no kakao for this type). */
  kakaoTemplate: string | null;
  /** Show on the main-page "진행 중" banner for the customer. */
  actionable: boolean;
};

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;
const num = (v: unknown): number | undefined =>
  typeof v === "number" ? v : undefined;
const won = (v: unknown): string => {
  const n = num(v);
  return n != null ? `${new Intl.NumberFormat("ko-KR").format(n)}원` : "";
};

const contractHref = (p: Record<string, unknown>) =>
  str(p.contract_id) ? `/me/contracts/${p.contract_id}` : "/me/contracts";
const projectHref = (p: Record<string, unknown>) =>
  str(p.project_id) ? `/me/projects/${p.project_id}` : "/me/projects";
const quoteHref = (p: Record<string, unknown>) =>
  str(p.quote_id) ? `/me/quotes/${p.quote_id}` : "/me/quotes";

const fallback: NotificationMeta = {
  icon: "ti-bell",
  tone: "bg-ink-5 text-ink-70",
  label: "알림",
  summary: () => "새 알림이 있습니다",
  hrefFor: () => "/me",
  kakaoTemplate: null,
  actionable: false,
};

// NOTE: keys here should match NotificationType. New canonical event types
// (quote_sent, deposit_paid, etc.) are mapped alongside the legacy names that
// existing code already emits, so nothing breaks.
export const NOTIFICATION_REGISTRY: Partial<
  Record<string, NotificationMeta>
> = {
  welcome: {
    icon: "ti-sparkles",
    tone: "bg-iris/15 text-iris",
    label: "환영합니다",
    summary: () => "STUDIO BODA에 오신 것을 환영합니다",
    hrefFor: () => "/me",
    kakaoTemplate: null,
    actionable: false,
  },

  // ── Quote ──
  quote_sent: {
    icon: "ti-file-invoice",
    tone: "bg-iris/15 text-iris",
    label: "견적서 도착",
    summary: (p) =>
      str(p.title) ? `견적: ${p.title}` : "새 견적서가 도착했습니다",
    hrefFor: quoteHref,
    kakaoTemplate: "BODA_QUOTE_SENT",
    actionable: true,
  },
  quote_received: {
    icon: "ti-file-invoice",
    tone: "bg-iris/15 text-iris",
    label: "견적서 도착",
    summary: (p) =>
      str(p.title) ? `견적: ${p.title}` : "새 견적서가 도착했습니다",
    hrefFor: quoteHref,
    kakaoTemplate: "BODA_QUOTE_SENT",
    actionable: true,
  },
  quote_package_sent: {
    icon: "ti-mail-fast",
    tone: "bg-iris/15 text-iris",
    label: "견적서·계약서·예약금 안내",
    summary: () => "견적서 확인 → 계약서 서명 → 예약금 결제 순으로 진행해주세요",
    hrefFor: contractHref,
    kakaoTemplate: "BODA_CONTRACT_SIGN_REQUEST",
    actionable: true,
  },

  // ── Contract ──
  contract_sent: {
    icon: "ti-file-text",
    tone: "bg-iris/15 text-iris",
    label: "계약서 도착",
    summary: () => "검토하고 서명할 계약서가 도착했습니다",
    hrefFor: contractHref,
    kakaoTemplate: "BODA_CONTRACT_SIGN_REQUEST",
    actionable: true,
  },
  contract_viewed: {
    icon: "ti-eye",
    tone: "bg-warning/15 text-warning",
    label: "계약서 열람",
    summary: () => "고객이 계약서를 열람했습니다",
    hrefFor: contractHref,
    kakaoTemplate: null,
    actionable: false,
  },
  contract_client_signed: {
    icon: "ti-signature",
    tone: "bg-sky/15 text-sky",
    label: "고객 서명 완료",
    summary: () => "고객이 계약서에 전자서명했습니다",
    hrefFor: contractHref,
    kakaoTemplate: null,
    actionable: false,
  },
  contract_admin_signed: {
    icon: "ti-file-check",
    tone: "bg-success/15 text-success",
    label: "회사 서명 완료",
    summary: () => "회사 서명이 완료되었습니다",
    hrefFor: contractHref,
    kakaoTemplate: null,
    actionable: false,
  },
  contract_signed: {
    icon: "ti-file-check",
    tone: "bg-success/15 text-success",
    label: "계약 체결 완료",
    summary: () => "계약이 체결되었습니다",
    hrefFor: contractHref,
    kakaoTemplate: null,
    actionable: false,
  },

  // ── Payments ──
  deposit_payment_requested: {
    icon: "ti-credit-card",
    tone: "bg-warning/15 text-warning",
    label: "예약금 결제 요청",
    summary: (p) =>
      won(p.amount) ? `예약금 ${won(p.amount)} 결제 대기` : "예약금 결제가 대기 중입니다",
    hrefFor: () => "/me/payments",
    kakaoTemplate: "BODA_DEPOSIT_REQUEST",
    actionable: true,
  },
  balance_payment_requested: {
    icon: "ti-credit-card",
    tone: "bg-warning/15 text-warning",
    label: "잔금 결제 요청",
    summary: (p) =>
      won(p.amount) ? `잔금 ${won(p.amount)} 결제 대기` : "잔금 결제가 대기 중입니다",
    hrefFor: () => "/me/payments",
    kakaoTemplate: "BODA_BALANCE_REQUEST",
    actionable: true,
  },
  payment_requested: {
    icon: "ti-credit-card",
    tone: "bg-warning/15 text-warning",
    label: "결제 요청",
    summary: (p) =>
      str(p.title) && won(p.amount)
        ? `${p.title} · ${won(p.amount)}`
        : "결제 요청이 도착했습니다",
    hrefFor: () => "/me/payments",
    kakaoTemplate: "BODA_DEPOSIT_REQUEST",
    actionable: true,
  },
  deposit_paid: {
    icon: "ti-circle-check",
    tone: "bg-success/15 text-success",
    label: "예약금 결제 완료",
    summary: (p) =>
      won(p.amount) ? `예약금 ${won(p.amount)} 결제 완료` : "예약금이 결제되었습니다",
    hrefFor: () => "/me/payments",
    kakaoTemplate: "BODA_DEPOSIT_PAID",
    actionable: false,
  },
  balance_paid: {
    icon: "ti-circle-check",
    tone: "bg-success/15 text-success",
    label: "잔금 결제 완료",
    summary: (p) =>
      won(p.amount) ? `잔금 ${won(p.amount)} 결제 완료` : "잔금이 결제되었습니다",
    hrefFor: () => "/me/payments",
    kakaoTemplate: null,
    actionable: false,
  },
  payment_paid: {
    icon: "ti-circle-check",
    tone: "bg-success/15 text-success",
    label: "결제 완료",
    summary: (p) =>
      str(p.title) && won(p.amount)
        ? `${p.title} · ${won(p.amount)} 결제 완료`
        : "결제가 완료되었습니다",
    hrefFor: () => "/me/payments",
    kakaoTemplate: "BODA_DEPOSIT_PAID",
    actionable: false,
  },
  payment_failed: {
    icon: "ti-alert-triangle",
    tone: "bg-error/15 text-error",
    label: "결제 실패",
    summary: () => "결제에 실패했습니다. 다시 시도해주세요",
    hrefFor: () => "/me/payments",
    kakaoTemplate: null,
    actionable: true,
  },

  // ── Project ──
  project_started: {
    icon: "ti-rocket",
    tone: "bg-iris/15 text-iris",
    label: "프로젝트 착수",
    summary: (p) =>
      str(p.title) ? `${p.title} · 제작 착수` : "프로젝트가 착수되었습니다",
    hrefFor: projectHref,
    kakaoTemplate: "BODA_PROJECT_STARTED",
    actionable: true,
  },
  project_update: {
    icon: "ti-progress",
    tone: "bg-sky/15 text-sky",
    label: "프로젝트 업데이트",
    summary: (p) =>
      str(p.status_label)
        ? `진행 상태: ${p.status_label}`
        : "프로젝트 진행 상태가 업데이트되었습니다",
    hrefFor: projectHref,
    kakaoTemplate: null,
    actionable: false,
  },
  project_delivered: {
    icon: "ti-package",
    tone: "bg-success/15 text-success",
    label: "결과물 전달",
    summary: (p) =>
      str(p.title) ? `${p.title} · 최종 전달` : "산출물이 전달되었습니다",
    hrefFor: projectHref,
    kakaoTemplate: "BODA_FINAL_DELIVERY",
    actionable: true,
  },
  final_delivery_uploaded: {
    icon: "ti-package",
    tone: "bg-success/15 text-success",
    label: "결과물 전달",
    summary: () => "최종 결과물이 업로드되었습니다",
    hrefFor: projectHref,
    kakaoTemplate: "BODA_FINAL_DELIVERY",
    actionable: true,
  },
  project_completed: {
    icon: "ti-flag-check",
    tone: "bg-success/15 text-success",
    label: "프로젝트 완료",
    summary: () => "프로젝트가 완료되었습니다",
    hrefFor: projectHref,
    kakaoTemplate: null,
    actionable: false,
  },
  file_uploaded: {
    icon: "ti-file-upload",
    tone: "bg-sky/15 text-sky",
    label: "파일 업로드",
    summary: () => "운영팀이 새 파일을 공유했습니다",
    hrefFor: projectHref,
    kakaoTemplate: null,
    actionable: true,
  },
  revision_requested: {
    icon: "ti-pencil",
    tone: "bg-warning/15 text-warning",
    label: "수정 요청",
    summary: () => "수정 요청이 접수되었습니다",
    hrefFor: projectHref,
    kakaoTemplate: "BODA_REVISION_REQUESTED",
    actionable: false,
  },
  comment_posted: {
    icon: "ti-messages",
    tone: "bg-ink-5 text-ink-70",
    label: "메시지",
    summary: () => "새 메시지가 도착했습니다",
    hrefFor: projectHref,
    kakaoTemplate: null,
    actionable: false,
  },
};

export function notificationMeta(type: string): NotificationMeta {
  return NOTIFICATION_REGISTRY[type] ?? fallback;
}

// ── Category (결제 / 프로젝트 / 계약 / 기타) — 타입명 기반 파생 ──
export type NotificationCategory = "payment" | "project" | "contract" | "system";

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  payment: "결제",
  project: "프로젝트",
  contract: "계약",
  system: "기타",
};

/** 알림 type을 고객용 카테고리로 분류. 우선순위: 결제 → 계약 → 프로젝트 → 기타. */
export function notificationCategory(type: string): NotificationCategory {
  const t = type.toLowerCase();
  if (/(payment|deposit|balance|refund|tax|subscription|invoice|charged|paid)/.test(t)) {
    return "payment";
  }
  if (/(contract|quote|sign)/.test(t)) return "contract";
  if (/(project|file|revision|deliver|comment|brief|kickoff|started|completed)/.test(t)) {
    return "project";
  }
  return "system";
}

/** Customer-facing event types that belong on the main-page progress banner. */
export function isActionable(type: string): boolean {
  return NOTIFICATION_REGISTRY[type]?.actionable ?? false;
}

/** The Kakao Alimtalk template code for an event, if any. */
export function kakaoTemplateFor(type: NotificationType | string): string | null {
  return NOTIFICATION_REGISTRY[type]?.kakaoTemplate ?? null;
}
