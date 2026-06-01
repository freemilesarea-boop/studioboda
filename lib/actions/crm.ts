"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import type { CrmActivityType, LeadStatus } from "@/lib/types/db";
import { LEAD_PIPELINE } from "@/lib/types/db";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

// Internal helper — record a CRM activity row + bump inquiry.last_activity_at.
export async function logCrmActivity(input: {
  inquiryId: string;
  actorId?: string | null;
  type: CrmActivityType;
  body?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminSupabase();
  await admin.from("crm_activities").insert({
    inquiry_id: input.inquiryId,
    actor_id: input.actorId ?? null,
    type: input.type,
    body: input.body ?? null,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    metadata: input.metadata ?? {},
  });
  await admin
    .from("inquiries")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", input.inquiryId);
}

// Internal helper used by other actions (contracts/payments) to advance a lead.
export async function setLeadStatusForInquiry(
  inquiryId: string,
  to: LeadStatus,
  actorId?: string | null,
): Promise<void> {
  const admin = createAdminSupabase();
  const { data: inq } = await admin
    .from("inquiries")
    .select("lead_status")
    .eq("id", inquiryId)
    .maybeSingle();
  const from = (inq?.lead_status as string | null) ?? null;
  if (from === to) return;
  await admin.from("inquiries").update({ lead_status: to }).eq("id", inquiryId);
  await logCrmActivity({
    inquiryId,
    actorId,
    type: "status_change",
    fromStatus: from,
    toStatus: to,
  });
}

// ---- Admin: move a lead across the kanban ----
export async function moveLeadAction(
  inquiryId: string,
  toStatus: LeadStatus,
): Promise<Result> {
  const me = await requireStaff();
  if (!LEAD_PIPELINE.includes(toStatus)) {
    return { ok: false, error: "올바르지 않은 상태입니다" };
  }
  const admin = createAdminSupabase();
  const { data: inq } = await admin
    .from("inquiries")
    .select("lead_status")
    .eq("id", inquiryId)
    .maybeSingle();
  if (!inq) return { ok: false, error: "리드를 찾을 수 없습니다" };
  const from = (inq.lead_status as string | null) ?? "new";
  if (from === toStatus) return { ok: true };

  await admin.from("inquiries").update({ lead_status: toStatus }).eq("id", inquiryId);
  await logCrmActivity({
    inquiryId,
    actorId: me.id,
    type: "status_change",
    fromStatus: from,
    toStatus,
  });
  await logActivity({
    actor_id: me.id,
    entity_type: "inquiry",
    entity_id: inquiryId,
    action: "lead_status_changed",
    metadata: { from, to: toStatus },
  });
  revalidatePath("/admin/crm");
  return { ok: true };
}

// ---- Admin: add a note / log a call or meeting ----
export async function addCrmActivityAction(
  inquiryId: string,
  type: CrmActivityType,
  body: string,
): Promise<Result> {
  const me = await requireStaff();
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "내용을 입력해주세요" };
  await logCrmActivity({ inquiryId, actorId: me.id, type, body: trimmed });
  revalidatePath("/admin/crm");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return { ok: true };
}

// ---- Admin: set estimated deal amount on a lead ----
export async function setLeadAmountAction(
  inquiryId: string,
  amount: number,
): Promise<Result> {
  const me = await requireStaff();
  const value = Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : 0;
  const admin = createAdminSupabase();
  await admin.from("inquiries").update({ estimated_amount: value }).eq("id", inquiryId);
  await logCrmActivity({
    inquiryId,
    actorId: me.id,
    type: "note",
    body: `예상 금액 ${new Intl.NumberFormat("ko-KR").format(value)}원`,
  });
  revalidatePath("/admin/crm");
  return { ok: true };
}

// ============================================================
// Inquiry pipeline sync — payment/quote/project → inquiries.status
// ============================================================
// The admin 문의 목록 UI reads inquiries.status (not lead_status). Payment
// completion previously only touched quote.payment_status + lead_status, so the
// list stayed on "견적 발송". This derives the correct inquiries.status (and
// keeps lead_status in sync) from the linked quote's payment state.
//
// Monotonic: never downgrades a further-along status (e.g. completed→quoted).
// Reused by the webhook, reconcile, and manual paths.

const INQUIRY_RANK: Record<string, number> = {
  new: 0,
  contacted: 1,
  quoted: 2,
  converted: 3,
  in_progress: 3,
  completed: 4,
  archived: 5,
};

const LEAD_FOR_INQUIRY: Record<string, LeadStatus> = {
  in_progress: "in_progress",
  completed: "completed",
  quoted: "quoted",
};

// Inquiry statuses that this pipeline owns (payment-driven). We only ever
// auto-move within these; human-set values like contacted are left alone.
const PIPELINE_OWNED = new Set(["quoted", "converted", "in_progress", "completed"]);

export async function syncInquiryPipelineForQuote(
  quoteId: string,
  opts?: { actorId?: string | null },
): Promise<void> {
  const admin = createAdminSupabase();
  const { data: quote } = await admin
    .from("quotes")
    .select("id, inquiry_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote?.inquiry_id) return;

  // Authoritative ACTIVE-paid signals (refunded/cancelled excluded by status).
  const { data: pays } = await admin
    .from("payments")
    .select("type, status")
    .eq("quote_id", quoteId)
    .eq("status", "paid");
  const paidTypes = new Set((pays ?? []).map((p) => p.type as string));
  const balancePaid = paidTypes.has("balance");
  const depositPaid = paidTypes.has("deposit");

  // Derived target from the CURRENT ledger (re-evaluated each call → handles
  // refunds by downgrading, not just upgrading).
  const target = balancePaid ? "completed" : depositPaid ? "in_progress" : "quoted";

  const { data: inq } = await admin
    .from("inquiries")
    .select("status")
    .eq("id", quote.inquiry_id)
    .maybeSingle();
  if (!inq) return;
  const cur = (inq.status as string) ?? "new";

  // Never touch archived or human-set early stages (new/contacted). Only move
  // when the inquiry is within the payment-driven set OR moving forward into it.
  const movingForward = (INQUIRY_RANK[target] ?? 0) > (INQUIRY_RANK[cur] ?? 0);
  const downgradeWithinPipeline =
    PIPELINE_OWNED.has(cur) && (INQUIRY_RANK[target] ?? 0) < (INQUIRY_RANK[cur] ?? 0);
  if (cur === "archived") return;
  if (!movingForward && !downgradeWithinPipeline) return;
  if (cur === target) return;

  const patch: Record<string, string> = { status: target };
  const lead = LEAD_FOR_INQUIRY[target];
  if (lead) patch.lead_status = lead;

  await admin.from("inquiries").update(patch).eq("id", quote.inquiry_id);
  await logActivity({
    actor_id: opts?.actorId ?? null,
    entity_type: "inquiry",
    entity_id: quote.inquiry_id as string,
    action: "inquiry_status_synced",
    metadata: { from: cur, to: target, quote_id: quoteId, source: "payment_pipeline" },
  });
  const body =
    target === "completed"
      ? "본결제 완료 → 완료"
      : target === "in_progress"
        ? "예약금 결제 완료 → 진행"
        : "결제 환불/취소 → 견적 발송 단계로 복귀";
  await logCrmActivity({
    inquiryId: quote.inquiry_id as string,
    actorId: opts?.actorId ?? null,
    type: "status_change",
    fromStatus: cur,
    toStatus: target,
    body,
  });
}
