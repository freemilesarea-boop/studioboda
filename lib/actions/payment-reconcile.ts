"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { dispatchKakao } from "@/lib/notifications/dispatch";
import { getPaymentProvider } from "@/lib/payments/provider";
import { tryKickoffForQuote } from "@/lib/projects/kickoff";
import { provisionContractForPaidDeposit } from "@/lib/contracts/provisioning";
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

  await logActivity({
    entity_type: "payment",
    entity_id: payment.id,
    action: "paid_side_effects_applied",
    metadata: { source: opts?.source ?? "reconcile" },
  });
}

/**
 * Staff action: re-query PayApp for every pending payment and apply paid
 * status when PayApp confirms. Resilient fallback when the webhook forward is
 * dropped (e.g. blocked by deployment protection). Returns a summary.
 */
export async function reconcilePendingPaymentsAction(): Promise<
  Result<{ checked: number; paid: number; details: string[] }>
> {
  await requireStaff();
  const admin = createAdminSupabase();
  const provider = getPaymentProvider();
  if (!provider.queryPaymentStatus) {
    return { ok: false, error: "이 결제 제공자는 상태 조회를 지원하지 않습니다" };
  }

  const { data: pendings } = await admin
    .from("payments")
    .select("id, payapp_mul_no, amount, status")
    .eq("status", "pending")
    .not("payapp_mul_no", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

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
      // amount-tamper guard: PayApp price must match our amount when present
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

  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/me/payments");
  return { ok: true, checked: rows.length, paid, details };
}
