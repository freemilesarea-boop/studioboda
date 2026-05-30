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
