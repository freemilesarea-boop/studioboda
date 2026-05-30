// ============================================================
// STUDIO BODA — Project kickoff gate
// ============================================================
// A project may only enter "진행중(in_progress)" when BOTH conditions hold:
//   • 계약서 전자서명 완료 (client_signature present, contract not cancelled)
//   • 예약금(deposit) 결제 완료 (payment type=deposit, status=paid)
//
// This module derives the readiness from existing rows and performs the
// idempotent state transition. Callable from system context (webhook, sign
// action) — no auth inside. Admin override is a separate explicit path.
// ============================================================

import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { setLeadStatusForInquiry } from "@/lib/actions/crm";

export type KickoffReadiness = {
  contractSigned: boolean;
  depositPaid: boolean;
  ready: boolean;
  projectId: string | null;
  projectStatus: string | null;
  billingStatus: string | null;
};

/**
 * Inspect the contract + deposit payment + project tied to a quote and report
 * whether both kickoff conditions are met. Read-only.
 */
export async function kickoffReadinessForQuote(
  quoteId: string,
): Promise<KickoffReadiness> {
  const admin = createAdminSupabase();

  const [{ data: contract }, { data: deposit }, { data: project }] =
    await Promise.all([
      admin
        .from("contracts")
        .select("client_signature, status")
        .eq("quote_id", quoteId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("payments")
        .select("id")
        .eq("quote_id", quoteId)
        .eq("type", "deposit")
        .eq("status", "paid")
        .limit(1)
        .maybeSingle(),
      admin
        .from("projects")
        .select("id, status, billing_status")
        .eq("quote_id", quoteId)
        .maybeSingle(),
    ]);

  const contractSigned = Boolean(
    contract?.client_signature &&
      contract.status !== "cancelled" &&
      contract.status !== "expired",
  );
  const depositPaid = Boolean(deposit);

  return {
    contractSigned,
    depositPaid,
    ready: contractSigned && depositPaid,
    projectId: (project?.id as string | null) ?? null,
    projectStatus: (project?.status as string | null) ?? null,
    billingStatus: (project?.billing_status as string | null) ?? null,
  };
}

/**
 * If both kickoff conditions are met, transition the linked project to
 * 진행중: status queued→briefing and billing_status→in_progress. Idempotent —
 * a project already past queued is left as-is. Returns whether it kicked off.
 */
export async function tryKickoffForQuote(
  quoteId: string,
  opts?: { actorId?: string | null },
): Promise<{ kickedOff: boolean; reason?: string }> {
  const admin = createAdminSupabase();
  const r = await kickoffReadinessForQuote(quoteId);
  if (!r.ready) {
    return {
      kickedOff: false,
      reason: !r.contractSigned ? "contract_unsigned" : "deposit_unpaid",
    };
  }
  if (!r.projectId) return { kickedOff: false, reason: "no_project" };
  // Idempotency: only kick off a project still queued (or already in_progress
  // billing but never advanced). Don't disturb projects already in production.
  if (r.projectStatus && r.projectStatus !== "queued") {
    // Ensure billing reflects in_progress at least.
    if (r.billingStatus !== "in_progress" && r.billingStatus !== "waiting_balance" && r.billingStatus !== "completed") {
      await admin
        .from("projects")
        .update({ billing_status: "in_progress" })
        .eq("id", r.projectId);
    }
    return { kickedOff: false, reason: "already_started" };
  }

  await admin
    .from("projects")
    .update({ status: "briefing", billing_status: "in_progress" })
    .eq("id", r.projectId);

  await logActivity({
    actor_id: opts?.actorId ?? null,
    entity_type: "project",
    entity_id: r.projectId,
    action: "project_kickoff",
    metadata: {
      quote_id: quoteId,
      contract_signed: true,
      deposit_paid: true,
      auto: opts?.actorId ? false : true,
    },
  });

  // Notify customer + staff, advance the CRM lead.
  const { data: project } = await admin
    .from("projects")
    .select("user_id, title, inquiry_id")
    .eq("id", r.projectId)
    .maybeSingle();
  if (project?.user_id) {
    void createNotification(project.user_id, "project_started", {
      project_id: r.projectId,
      title: project.title,
    });
  }
  void notifyStaff("project_started", {
    project_id: r.projectId,
    title: project?.title,
  });
  if (project?.inquiry_id) {
    void setLeadStatusForInquiry(
      project.inquiry_id as string,
      "in_progress",
      opts?.actorId ?? null,
    );
  }

  return { kickedOff: true };
}

/**
 * Admin override: force a project into 진행중 even when the contract is not
 * signed (e.g. verbal agreement, offline contract). Always logged.
 */
export async function forceKickoffProject(
  projectId: string,
  actorId: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminSupabase();
  const { data: project } = await admin
    .from("projects")
    .select("id, status, user_id, title, quote_id, inquiry_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return { ok: false, error: "프로젝트를 찾을 수 없습니다" };

  await admin
    .from("projects")
    .update({
      status: project.status === "queued" ? "briefing" : project.status,
      billing_status: "in_progress",
    })
    .eq("id", projectId);

  await logActivity({
    actor_id: actorId,
    entity_type: "project",
    entity_id: projectId,
    action: "project_kickoff_override",
    metadata: { reason, forced: true },
  });

  if (project.user_id) {
    void createNotification(project.user_id, "project_started", {
      project_id: projectId,
      title: project.title,
    });
  }
  if (project.inquiry_id) {
    void setLeadStatusForInquiry(
      project.inquiry_id as string,
      "in_progress",
      actorId,
    );
  }

  return { ok: true };
}
