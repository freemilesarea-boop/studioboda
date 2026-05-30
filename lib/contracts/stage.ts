// ============================================================
// STUDIO BODA — Contract lifecycle stage (derived)
// ============================================================
// The DB `contracts.status` is the coarse machine state
// (draft/sent/viewed/signed/cancelled/expired). The real-world contract
// lifecycle the team operates on is richer and must clearly separate the
// customer signature, the deposit payment, and the company counter-signature:
//
//   draft → sent → viewed → client_signed → deposit_paid → admin_signed(=완료)
//
// This helper DERIVES that stage from existing columns + the deposit payment,
// so we get the clear separation without a fragile CHECK-constraint migration.
// ============================================================

import type { Contract } from "@/lib/types/db";

export type ContractStage =
  | "draft"
  | "sent"
  | "viewed"
  | "client_signed"
  | "deposit_paid"
  | "completed"
  | "cancelled"
  | "expired";

export const contractStageLabels: Record<ContractStage, string> = {
  draft: "작성 중",
  sent: "발송됨",
  viewed: "고객 열람",
  client_signed: "고객 서명 완료",
  deposit_paid: "예약금 결제 완료",
  completed: "계약 체결 완료",
  cancelled: "취소",
  expired: "만료",
};

export const contractStageTone: Record<ContractStage, string> = {
  draft: "bg-ink-15 text-ink-70",
  sent: "bg-iris/15 text-iris",
  viewed: "bg-warning/15 text-warning",
  client_signed: "bg-sky/15 text-sky",
  deposit_paid: "bg-iris/15 text-iris",
  completed: "bg-success/15 text-success",
  cancelled: "bg-ink-5 text-ink-70",
  expired: "bg-ink-5 text-ink-70",
};

// Ordered stages for a progress indicator (terminal states excluded).
export const CONTRACT_STAGE_FLOW: ContractStage[] = [
  "sent",
  "viewed",
  "client_signed",
  "deposit_paid",
  "completed",
];

/**
 * Compute the lifecycle stage from a contract + whether its deposit is paid.
 * Both signatures present ⇒ completed. Otherwise the furthest milestone
 * reached: deposit_paid > client_signed > viewed > sent > draft.
 */
export function contractStage(
  c: Pick<
    Contract,
    "status" | "client_signature" | "admin_signature" | "viewed_at"
  >,
  depositPaid: boolean,
): ContractStage {
  if (c.status === "cancelled") return "cancelled";
  if (c.status === "expired") return "expired";
  if (c.client_signature && c.admin_signature) return "completed";
  if (depositPaid) return "deposit_paid";
  if (c.client_signature) return "client_signed";
  if (c.status === "viewed" || c.viewed_at) return "viewed";
  if (c.status === "sent") return "sent";
  return "draft";
}
