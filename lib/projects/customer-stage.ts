// ============================================================
// STUDIO BODA — Customer-facing project stage (display only)
// ============================================================
// Translates the internal project.status (+ billing_status) into a plain,
// customer-language 7-stage journey with an auto progress %, the next stage,
// and a "지금 할 일" CTA. Pure / no DB. Used by the customer project detail
// stepper and the project list. Does NOT change any status — display layer only.
// ============================================================

import type { ProjectStatus } from "@/lib/types/db";

export type StageTab = "brief" | "materials" | "chat" | "revisions" | "deliverables";

export type CustomerStage = {
  stageKey: string;
  stageLabel: string;
  stepIndex: number; // 1..7 (0 when cancelled)
  totalSteps: number; // 7
  percent: number; // 0..100
  nextLabel: string | null;
  ctaLabel: string | null;
  ctaHref: string | null; // route CTA (e.g. /me/contracts)
  ctaTab: StageTab | null; // in-page tab CTA (브리프/산출물 등)
  description: string; // 지금 할 일 / 현재 상황 한 줄
  cancelled: boolean;
};

export const CUSTOMER_STAGES: Array<{ key: string; label: string }> = [
  { key: "contract_deposit", label: "계약·예약금" },
  { key: "brief", label: "브리프 작성" },
  { key: "production", label: "제작 중" },
  { key: "review", label: "시안 검토" },
  { key: "revision", label: "수정 반영" },
  { key: "delivery", label: "최종 전달" },
  { key: "completed", label: "완료" },
];
const TOTAL = CUSTOMER_STAGES.length;

function build(idx: number, percent: number, extra: Partial<CustomerStage>): CustomerStage {
  const s = CUSTOMER_STAGES[idx - 1];
  return {
    stageKey: s.key,
    stageLabel: s.label,
    stepIndex: idx,
    totalSteps: TOTAL,
    percent,
    nextLabel: idx < TOTAL ? CUSTOMER_STAGES[idx].label : null,
    ctaLabel: null,
    ctaHref: null,
    ctaTab: null,
    description: "",
    cancelled: false,
    ...extra,
  };
}

/**
 * Map internal status + billing_status → customer stage.
 * Priority: cancelled → completed → 본결제 대기(waiting_balance) → status.
 */
export function customerStage(
  status: ProjectStatus,
  billing: string | null | undefined,
): CustomerStage {
  if (status === "cancelled") {
    return {
      stageKey: "cancelled",
      stageLabel: "취소됨",
      stepIndex: 0,
      totalSteps: TOTAL,
      percent: 0,
      nextLabel: null,
      ctaLabel: null,
      ctaHref: null,
      ctaTab: null,
      description: "프로젝트가 취소되었습니다.",
      cancelled: true,
    };
  }
  if (status === "completed") {
    return build(7, 100, { description: "프로젝트가 완료되었습니다. 감사합니다!" });
  }
  // 본결제 대기는 status가 delivered가 아니어도 "최종 전달" 단계로 본다.
  if (billing === "waiting_balance") {
    return build(6, 95, {
      description: "최종 산출물이 전달되었습니다. 본결제를 진행해주세요.",
      ctaLabel: "본결제 진행",
      ctaHref: "/me/payments",
    });
  }
  switch (status) {
    case "delivered":
      return build(6, 95, {
        description: "최종 산출물을 확인하고 다운로드하세요.",
        ctaLabel: "산출물 확인",
        ctaTab: "deliverables",
      });
    case "revision":
      return build(5, 80, { description: "요청하신 수정을 반영하고 있습니다." });
    case "review":
      return build(4, 70, {
        description: "전달된 시안을 확인하고 피드백을 남겨주세요.",
        ctaLabel: "시안 확인",
        ctaTab: "deliverables",
      });
    case "designing":
    case "ai_draft":
      return build(3, 50, { description: "디자이너가 작업 중입니다. 완료를 기다려 주세요." });
    case "briefing":
      return build(2, 25, {
        description: "제작에 필요한 브리프를 작성·제출해주세요.",
        ctaLabel: "브리프 작성하기",
        ctaTab: "brief",
      });
    case "queued":
    default:
      return build(1, 10, {
        description: "계약서 서명과 예약금 결제가 필요합니다.",
        ctaLabel: "계약서 확인",
        ctaHref: "/me/contracts",
      });
  }
}

/** Customer stage key for a raw internal status (billing-agnostic). For timelines. */
export function stageKeyForStatus(status: ProjectStatus): string {
  return customerStage(status, null).stageKey;
}

/**
 * Hybrid progress: the manual projects.progress override wins when set (>0),
 * otherwise the status-derived auto percent. Keeps the manual field useful.
 */
export function displayProgress(
  manualProgress: number | null | undefined,
  status: ProjectStatus,
  billing: string | null | undefined,
): number {
  const m = manualProgress ?? 0;
  if (m > 0) return Math.min(100, m);
  return customerStage(status, billing).percent;
}
