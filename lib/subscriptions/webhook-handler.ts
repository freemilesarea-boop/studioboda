import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { payappEnv } from "@/lib/env";
import type { RecurringEventDescriptor } from "@/lib/payments/providers/payapp-recurring";
import type { Subscription } from "@/lib/types/db";

function verifySignature(body: Record<string, string>): boolean {
  try {
    const env = payappEnv();
    return (
      body.linkval === env.LINKVAL &&
      (!body.linkkey || body.linkkey === env.LINKKEY)
    );
  } catch {
    return false;
  }
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export async function handleRecurringWebhook(
  body: Record<string, string>,
  event: RecurringEventDescriptor,
): Promise<NextResponse> {
  if (event.kind === "none") {
    return new NextResponse("NOT_RECURRING", { status: 400 });
  }
  if (!verifySignature(body)) {
    return new NextResponse("INVALID_SIGNATURE", { status: 401 });
  }

  const admin = createAdminSupabase();

  // ---- Card registration result ----
  if (event.kind === "registration") {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("id", event.subscriptionId)
      .maybeSingle();
    if (!sub) {
      return new NextResponse("SUBSCRIPTION_NOT_FOUND", { status: 404 });
    }
    const subscription = sub as Subscription;

    if (event.eventStatus === "failed") {
      await logActivity({
        entity_type: "subscription",
        entity_id: subscription.id,
        action: "subscription_registration_failed",
        metadata: { reason: event.reason, mul_no: event.providerMulNo },
      });
      return new NextResponse("SUCCESS");
    }

    if (!event.billingKey) {
      // success without recu_no — log and return success anyway so PayApp
      // doesn't retry, but flag for ops.
      await logActivity({
        entity_type: "subscription",
        entity_id: subscription.id,
        action: "subscription_registration_missing_key",
        metadata: { raw: body },
      });
      return new NextResponse("SUCCESS");
    }

    // Already activated and key matches → idempotent ack
    if (
      subscription.status === "active" &&
      subscription.payapp_billing_key === event.billingKey
    ) {
      return new NextResponse("SUCCESS");
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const nextChargeAt = addMonths(todayIso, 1);

    // Record the first invoice as paid (the PayApp registration call collects
    // the first month's payment immediately).
    const { data: invoice } = await admin
      .from("subscription_invoices")
      .insert({
        subscription_id: subscription.id,
        amount: subscription.monthly_amount,
        status: "paid" as const,
        period_start: todayIso,
        period_end: nextChargeAt,
        attempt_number: 1,
        charged_at: new Date().toISOString(),
        payapp_mul_no: event.providerMulNo,
      })
      .select("id")
      .single();

    await admin
      .from("subscriptions")
      .update({
        payapp_billing_key: event.billingKey,
        status: "active" as const,
        started_at: new Date().toISOString(),
        current_period_start: todayIso,
        current_period_end: nextChargeAt,
        next_charge_at: nextChargeAt,
        retry_count: 0,
        last_failure_at: null,
        last_failure_reason: null,
      })
      .eq("id", subscription.id);

    await logActivity({
      entity_type: "subscription",
      entity_id: subscription.id,
      action: "subscription_activated",
      metadata: {
        billing_key_present: true,
        first_invoice_id: invoice?.id,
        mul_no: event.providerMulNo,
      },
    });

    if (subscription.user_id) {
      void createNotification(subscription.user_id, "subscription_activated", {
        subscription_id: subscription.id,
        plan_name: subscription.plan_name,
        monthly_amount: subscription.monthly_amount,
        next_charge_at: nextChargeAt,
      });
      void createNotification(subscription.user_id, "subscription_charged", {
        subscription_id: subscription.id,
        amount: subscription.monthly_amount,
        plan_name: subscription.plan_name,
      });
    }
    void notifyStaff("subscription_activated", {
      subscription_id: subscription.id,
      plan_name: subscription.plan_name,
      user_id: subscription.user_id,
    });

    return new NextResponse("SUCCESS");
  }

  // ---- Monthly charge result ----
  // (Charges from the cron also record success synchronously; this path
  // handles the PayApp-delivered confirmation/failure webhook as a backstop.)
  const { data: invoice } = await admin
    .from("subscription_invoices")
    .select("*, subscription:subscription_id(*)")
    .eq("id", event.invoiceId)
    .maybeSingle();
  if (!invoice) {
    return new NextResponse("INVOICE_NOT_FOUND", { status: 404 });
  }
  const subscription = (invoice as { subscription: Subscription }).subscription;

  // Idempotent ack
  if (
    (invoice as { status: string }).status === "paid" &&
    event.eventStatus === "success"
  ) {
    return new NextResponse("SUCCESS");
  }

  if (event.eventStatus === "success") {
    const todayIso = new Date().toISOString().slice(0, 10);
    const nextChargeAt = addMonths(todayIso, 1);

    await admin
      .from("subscription_invoices")
      .update({
        status: "paid" as const,
        charged_at: new Date().toISOString(),
        payapp_mul_no: event.providerMulNo,
      })
      .eq("id", event.invoiceId);

    await admin
      .from("subscriptions")
      .update({
        status: "active" as const,
        current_period_start: todayIso,
        current_period_end: nextChargeAt,
        next_charge_at: nextChargeAt,
        retry_count: 0,
        last_failure_at: null,
        last_failure_reason: null,
      })
      .eq("id", subscription.id);

    if (subscription.user_id) {
      void createNotification(subscription.user_id, "subscription_charged", {
        subscription_id: subscription.id,
        invoice_id: event.invoiceId,
        amount: subscription.monthly_amount,
        plan_name: subscription.plan_name,
      });
    }

    await logActivity({
      entity_type: "subscription_invoice",
      entity_id: event.invoiceId,
      action: "invoice_paid_webhook",
      metadata: { mul_no: event.providerMulNo },
    });

    return new NextResponse("SUCCESS");
  }

  // Failure
  await admin
    .from("subscription_invoices")
    .update({
      status: "failed" as const,
      failed_at: new Date().toISOString(),
      failure_reason: event.reason,
    })
    .eq("id", event.invoiceId);

  await logActivity({
    entity_type: "subscription_invoice",
    entity_id: event.invoiceId,
    action: "invoice_failed_webhook",
    metadata: { reason: event.reason },
  });

  return new NextResponse("SUCCESS");
}
