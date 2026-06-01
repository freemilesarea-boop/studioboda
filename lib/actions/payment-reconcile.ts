"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { dispatchKakao } from "@/lib/notifications/dispatch";
import { getPaymentProvider } from "@/lib/payments/provider";
import { tryKickoffForQuote } from "@/lib/projects/kickoff";
import { provisionContractForPaidDeposit } from "@/lib/contracts/provisioning";
import { syncInquiryPipelineForQuote } from "@/lib/actions/crm";
import { revalidatePath } from "next/cache";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Apply the full "deposit/balance paid" side-effects for a payment that is now
 * known-paid (from webhook OR reconcile). Idempotent: skips if already paid.
 * Mirrors the webhook's paid branch so both paths converge on identical state.
 */
export async function applyPaidSideEffects(
  paymentId: string,
  opts?: { paidAt?: string; source?: string },
): Promise<void> {
  const admin = createAdminSupabase();
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return;

  const nowIso = opts?.paidAt ?? new Date().toISOString();
  if (payment.status !== "paid") {
    await admin
      .from("payments")
      .update({
        status: "paid",
        paid_at: payment.paid_at ?? nowIso,
        metadata: {
          ...((payment.metadata as object) ?? {}),
          last_webhook_state: "4",
          last_webhook_at: nowIso,
          reconciled_via: opts?.source ?? "reconcile",
        },
      })
      .eq("id", paymentId);
  }

  if (payment.type === "deposit" && payment.quote_id) {
    await admin
      .from("quotes")
      .update({ payment_status: "deposit_paid" })
      .eq("id", payment.quote_id)
      .neq("payment_status", "fully_paid");
  } else if (payment.type === "balance" && payment.quote_id) {
    await admin
      .from("quotes")
      .update({ payment_status: "fully_paid" })
      .eq("id", payment.quote_id);
  }

  void createNotification(payment.user_id, "payment_paid", {
    payment_id: payment.id,
    type: payment.type,
    amount: payment.amount,
    title: payment.title,
  });
  void notifyStaff("payment_paid", {
    payment_id: payment.id,
    type: payment.type,
    amount: payment.amount,
    title: payment.title,
  });
  if (payment.type === "deposit") {
    void dispatchKakao({
      userId: payment.user_id,
      type: "deposit_paid",
      payload: { amount: payment.amount, title: payment.title },
    });
  }

  // Deposit paid → ensure contract exists/sent + try kickoff gate.
  if (payment.type === "deposit" && payment.quote_id) {
    try {
      await provisionContractForPaidDeposit(payment.quote_id);
    } catch {
      /* best-effort */
    }
    await tryKickoffForQuote(payment.quote_id);
  }

  // Sync 문의 목록 상태 (inquiries.status) — deposit→진행, balance→완료.
  if (payment.quote_id) {
    await syncInquiryPipelineForQuote(payment.quote_id);
  }

  await logActivity({
    entity_type: "payment",
    entity_id: payment.id,
    action: "paid_side_effects_applied",
    metadata: { source: opts?.source ?? "reconcile" },
  });
}

/**
 * Core reconcile: re-query PayApp for every pending payment and apply paid
 * status when confirmed. No auth — callable from cron or the staff action.
 */
export async function reconcilePendingPaymentsCore(): Promise<{
  checked: number;
  paid: number;
  refunded: number;
  details: string[];
}> {
  const admin = createAdminSupabase();
  const provider = getPaymentProvider();
  if (!provider.queryPaymentStatus) {
    return { checked: 0, paid: 0, refunded: 0, details: ["provider has no queryPaymentStatus"] };
  }

  const { data: pendings } = await admin
    .from("payments")
    .select("id, payapp_mul_no, amount, status")
    .eq("status", "pending")
    .not("payapp_mul_no", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (pendings ?? []) as Array<{
    id: string;
    payapp_mul_no: string | null;
    amount: number;
  }>;
  let paid = 0;
  const details: string[] = [];

  for (const row of rows) {
    if (!row.payapp_mul_no) continue;
    const q = await provider.queryPaymentStatus(row.payapp_mul_no);
    if (!q.ok) {
      details.push(`${row.payapp_mul_no}: 조회실패(${q.error})`);
      continue;
    }
    if (q.status === "paid") {
      if (q.amount != null && q.amount !== row.amount) {
        details.push(`${row.payapp_mul_no}: 금액불일치(${q.amount}≠${row.amount}) — 보류`);
        await logActivity({
          entity_type: "payment",
          entity_id: row.id,
          action: "reconcile_amount_mismatch",
          metadata: { expected: row.amount, received: q.amount },
        });
        continue;
      }
      await applyPaidSideEffects(row.id, { source: "reconcile_payapp" });
      paid += 1;
      details.push(`${row.payapp_mul_no}: 결제완료 반영`);
    } else if (q.status === "cancelled" || q.status === "failed") {
      await admin
        .from("payments")
        .update({ status: q.status, metadata: { reconciled_via: "reconcile_payapp", last_webhook_state: q.rawState } })
        .eq("id", row.id);
      details.push(`${row.payapp_mul_no}: ${q.status}`);
    }
  }

  // Second pass: re-verify recent PAID payments against PayApp. If PayApp now
  // reports a cancellation (refund/매출취소), reflect it as refunded and reverse
  // the downstream state (quote/project/inquiry). Catches refunds whose webhook
  // never reached us.
  let refunded = 0;
  const { data: paidRows } = await admin
    .from("payments")
    .select("id, payapp_mul_no, amount, type, quote_id, project_id")
    .eq("status", "paid")
    .not("payapp_mul_no", "is", null)
    .order("paid_at", { ascending: false })
    .limit(50);

  for (const p of (paidRows ?? []) as Array<{
    id: string;
    payapp_mul_no: string | null;
    amount: number;
    type: string;
    quote_id: string | null;
    project_id: string | null;
  }>) {
    if (!p.payapp_mul_no) continue;
    const q = await provider.queryPaymentStatus(p.payapp_mul_no);
    if (!q.ok) continue;
    if (q.status === "cancelled" || q.status === "failed") {
      await admin
        .from("payments")
        .update({
          status: "refunded",
          refunded_at: new Date().toISOString(),
          refund_reason: "PayApp 취소/환불 자동 반영(reconcile)",
          metadata: { reconciled_via: "reconcile_refund", last_webhook_state: q.rawState },
        })
        .eq("id", p.id);
      // Reverse quote/project state.
      if (p.quote_id) {
        if (p.type === "deposit") {
          await admin.from("quotes").update({ payment_status: "unpaid" }).eq("id", p.quote_id);
          if (p.project_id) await admin.from("projects").update({ billing_status: "waiting_deposit" }).eq("id", p.project_id);
        } else if (p.type === "balance") {
          await admin.from("quotes").update({ payment_status: "deposit_paid" }).eq("id", p.quote_id);
          if (p.project_id) await admin.from("projects").update({ billing_status: "in_progress" }).eq("id", p.project_id);
        }
        await syncInquiryPipelineForQuote(p.quote_id);
      }
      await logActivity({
        entity_type: "payment",
        entity_id: p.id,
        action: "refund_auto_reconciled",
        metadata: { mul_no: p.payapp_mul_no, raw_state: q.rawState },
      });
      refunded += 1;
      details.push(`${p.payapp_mul_no}: 환불 자동 반영`);
    }
  }

  return { checked: rows.length, paid, refunded, details };
}

/**
 * Staff action wrapper around the reconcile core (manual button).
 */
export async function reconcilePendingPaymentsAction(): Promise<
  Result<{ checked: number; paid: number; refunded: number; details: string[] }>
> {
  await requireStaff();
  const r = await reconcilePendingPaymentsCore();
  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/me/payments");
  return { ok: true, ...r };
}
