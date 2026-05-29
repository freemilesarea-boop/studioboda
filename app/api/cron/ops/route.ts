import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import {
  cancelRecurringBinding,
  chargeRecurring,
} from "@/lib/payments/providers/payapp-recurring";
import type { Subscription } from "@/lib/types/db";

export const dynamic = "force-dynamic";

const ONE_DAY = 24 * 60 * 60 * 1000;
const SUBSCRIPTION_MAX_RETRY_DAYS = 7;

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

type Outcome = {
  ok: true;
  ranAt: string;
  quoteExpiringSoon: number;
  quoteExpired: number;
  projectDueSoon: number;
  paymentReminders: number;
  subscriptionsCharged: number;
  subscriptionsFailed: number;
  subscriptionsAutoCanceled: number;
};

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest): Promise<NextResponse<Outcome | { ok: false; error: string }>> {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminSupabase();
  const now = Date.now();
  const in24h = new Date(now + ONE_DAY).toISOString();
  const nowIso = new Date(now).toISOString();
  const since24h = new Date(now - ONE_DAY).toISOString();

  const [
    { data: expiringSoon },
    { data: expired },
    { data: dueSoon },
    { data: pendingPayments },
  ] = await Promise.all([
    admin
      .from("quotes")
      .select("id,title,user_id,expires_at")
      .in("status", ["sent", "customer_review"])
      .not("expires_at", "is", null)
      .gt("expires_at", nowIso)
      .lte("expires_at", in24h),
    admin
      .from("quotes")
      .select("id,title,user_id,expires_at,status")
      .in("status", ["sent", "customer_review"])
      .not("expires_at", "is", null)
      .lte("expires_at", nowIso),
    admin
      .from("projects")
      .select("id,project_no,title,user_id,assigned_to,due_date,status")
      .not("due_date", "is", null)
      .gte("due_date", nowIso.slice(0, 10))
      .lte("due_date", in24h.slice(0, 10))
      .not("status", "in", "(delivered,completed,cancelled)"),
    admin
      .from("payments")
      .select("id,type,title,amount,quote_id,project_id,user_id,created_at")
      .eq("status", "pending")
      .lte("created_at", since24h),
  ]);

  let qSoon = 0;
  for (const q of expiringSoon ?? []) {
    await createNotification(q.user_id, "quote_expiring_soon", {
      quote_id: q.id,
      title: q.title,
      expires_at: q.expires_at,
    });
    qSoon++;
  }

  let qExp = 0;
  for (const q of expired ?? []) {
    await admin.from("quotes").update({ status: "expired" }).eq("id", q.id);
    await createNotification(q.user_id, "quote_expired", {
      quote_id: q.id,
      title: q.title,
    });
    await logActivity({
      entity_type: "quote",
      entity_id: q.id,
      action: "quote_expired_auto",
      metadata: { source: "cron" },
    });
    qExp++;
  }

  let dSoon = 0;
  for (const p of dueSoon ?? []) {
    await createNotification(p.assigned_to ?? p.user_id, "project_due_soon", {
      project_id: p.id,
      project_no: p.project_no,
      title: p.title,
      due_date: p.due_date,
    });
    if (!p.assigned_to) {
      await notifyStaff("project_due_soon", {
        project_id: p.id,
        project_no: p.project_no,
        title: p.title,
        due_date: p.due_date,
      });
    }
    dSoon++;
  }

  let pRem = 0;
  for (const r of pendingPayments ?? []) {
    await createNotification(r.user_id, "payment_reminder", {
      payment_id: r.id,
      title: r.title,
      amount: r.amount,
      type: r.type,
      quote_id: r.quote_id,
      project_id: r.project_id,
    });
    pRem++;
  }

  // ---- Subscription auto-charging ----
  // Active or past_due subscriptions whose next_charge_at is today or earlier.
  // For each: attempt one charge via PayApp recupay. On success advance period
  // by 1 month. On failure increment retry_count; if retry days >= 7, cancel.
  const today = new Date(now).toISOString().slice(0, 10);
  const { data: dueSubsRaw } = await admin
    .from("subscriptions")
    .select("*")
    .in("status", ["active", "past_due"])
    .not("next_charge_at", "is", null)
    .lte("next_charge_at", today)
    .not("payapp_billing_key", "is", null);

  const dueSubs = (dueSubsRaw ?? []) as Subscription[];

  let subCharged = 0;
  let subFailed = 0;
  let subAutoCanceled = 0;

  for (const sub of dueSubs) {
    if (!sub.payapp_billing_key) continue;

    const attemptNo = (sub.retry_count ?? 0) + 1;
    const { data: invoice } = await admin
      .from("subscription_invoices")
      .insert({
        subscription_id: sub.id,
        amount: sub.monthly_amount,
        status: "pending" as const,
        period_start: today,
        period_end: addMonths(today, 1),
        attempt_number: attemptNo,
      })
      .select("id")
      .single();
    const invoiceId = invoice?.id;
    if (!invoiceId) continue;

    const result = await chargeRecurring({
      invoiceId,
      subscriptionId: sub.id,
      billingKey: sub.payapp_billing_key,
      amount: sub.monthly_amount,
      goodName: `${sub.plan_name} 정기 구독`,
    });

    if (result.ok) {
      const nextChargeAt = addMonths(today, 1);
      await admin
        .from("subscription_invoices")
        .update({
          status: "paid" as const,
          charged_at: new Date().toISOString(),
          payapp_mul_no: result.providerMulNo,
        })
        .eq("id", invoiceId);
      await admin
        .from("subscriptions")
        .update({
          status: "active" as const,
          current_period_start: today,
          current_period_end: nextChargeAt,
          next_charge_at: nextChargeAt,
          retry_count: 0,
          last_failure_at: null,
          last_failure_reason: null,
        })
        .eq("id", sub.id);

      if (sub.user_id) {
        void createNotification(sub.user_id, "subscription_charged", {
          subscription_id: sub.id,
          invoice_id: invoiceId,
          amount: sub.monthly_amount,
          plan_name: sub.plan_name,
        });
      }
      await logActivity({
        entity_type: "subscription_invoice",
        entity_id: invoiceId,
        action: "invoice_paid_cron",
        metadata: { mul_no: result.providerMulNo },
      });
      subCharged++;
      continue;
    }

    // Failed
    const nextRetryCount = attemptNo;
    const nowIsoStamp = new Date().toISOString();
    await admin
      .from("subscription_invoices")
      .update({
        status: "failed" as const,
        failed_at: nowIsoStamp,
        failure_reason: result.error,
      })
      .eq("id", invoiceId);

    if (nextRetryCount >= SUBSCRIPTION_MAX_RETRY_DAYS) {
      // Auto-cancel after 7 failed retries
      void cancelRecurringBinding(sub.payapp_billing_key);
      await admin
        .from("subscriptions")
        .update({
          status: "canceled" as const,
          canceled_at: nowIsoStamp,
          canceled_reason: `자동 해지: ${SUBSCRIPTION_MAX_RETRY_DAYS}회 결제 실패`,
          canceled_by_actor: "system" as const,
          next_charge_at: null,
          last_failure_at: nowIsoStamp,
          last_failure_reason: result.error,
        })
        .eq("id", sub.id);

      if (sub.user_id) {
        void createNotification(sub.user_id, "subscription_canceled", {
          subscription_id: sub.id,
          plan_name: sub.plan_name,
          by: "system",
          reason: `${SUBSCRIPTION_MAX_RETRY_DAYS}회 결제 실패`,
        });
      }
      void notifyStaff("subscription_canceled", {
        subscription_id: sub.id,
        plan_name: sub.plan_name,
        by: "system",
        user_id: sub.user_id,
      });
      await logActivity({
        entity_type: "subscription",
        entity_id: sub.id,
        action: "subscription_auto_canceled",
        metadata: { reason: result.error, attempts: nextRetryCount },
      });
      subAutoCanceled++;
      continue;
    }

    // Schedule next-day retry, mark past_due
    const tomorrow = new Date(now + ONE_DAY).toISOString().slice(0, 10);
    await admin
      .from("subscriptions")
      .update({
        status: "past_due" as const,
        retry_count: nextRetryCount,
        next_charge_at: tomorrow,
        last_failure_at: nowIsoStamp,
        last_failure_reason: result.error,
      })
      .eq("id", sub.id);

    if (sub.user_id) {
      void createNotification(sub.user_id, "subscription_charge_failed", {
        subscription_id: sub.id,
        invoice_id: invoiceId,
        amount: sub.monthly_amount,
        plan_name: sub.plan_name,
        reason: result.error,
        retry_count: nextRetryCount,
        max_retries: SUBSCRIPTION_MAX_RETRY_DAYS,
      });
    }
    void notifyStaff("subscription_charge_failed", {
      subscription_id: sub.id,
      plan_name: sub.plan_name,
      user_id: sub.user_id,
      retry_count: nextRetryCount,
    });

    await logActivity({
      entity_type: "subscription_invoice",
      entity_id: invoiceId,
      action: "invoice_failed_cron",
      metadata: { reason: result.error, attempt: nextRetryCount },
    });
    subFailed++;
  }

  await logActivity({
    entity_type: "system",
    action: "cron_ops_run",
    metadata: {
      quote_expiring_soon: qSoon,
      quote_expired: qExp,
      project_due_soon: dSoon,
      payment_reminder: pRem,
      subscriptions_charged: subCharged,
      subscriptions_failed: subFailed,
      subscriptions_auto_canceled: subAutoCanceled,
    },
  });

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    quoteExpiringSoon: qSoon,
    quoteExpired: qExp,
    projectDueSoon: dSoon,
    paymentReminders: pRem,
    subscriptionsCharged: subCharged,
    subscriptionsFailed: subFailed,
    subscriptionsAutoCanceled: subAutoCanceled,
  });
}
