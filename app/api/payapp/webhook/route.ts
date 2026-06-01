import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { getPaymentProvider } from "@/lib/payments/provider";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { sendTemplate } from "@/lib/email/send";
import { parseRecurringEvent } from "@/lib/payments/providers/payapp-recurring";
import { handleRecurringWebhook } from "@/lib/subscriptions/webhook-handler";
import { provisionContractForPaidDeposit } from "@/lib/contracts/provisioning";
import { tryKickoffForQuote } from "@/lib/projects/kickoff";
import { syncInquiryPipelineForQuote } from "@/lib/actions/crm";
import { dispatchKakao } from "@/lib/notifications/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseForm(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of text.split("&")) {
    if (!pair) continue;
    const i = pair.indexOf("=");
    const k = i === -1 ? pair : pair.slice(0, i);
    const v = i === -1 ? "" : pair.slice(i + 1);
    out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, " "));
  }
  return out;
}

export async function POST(req: Request) {
  // PayApp posts application/x-www-form-urlencoded
  const text = await req.text();
  const body = parseForm(text);

  // Subscription / 자동결제 events are routed by var2 prefix (subreg:/subinv:).
  // They have a separate state machine from one-shot payments, so dispatch
  // before the one-shot handler picks them up.
  const recurring = parseRecurringEvent(body);
  if (recurring.kind !== "none") {
    return handleRecurringWebhook(body, recurring);
  }

  const provider = getPaymentProvider();
  const event = provider.verifyAndParseWebhook(body, req.headers);

  if (!event.ok) {
    return new NextResponse("INVALID_SIGNATURE", { status: 401 });
  }
  if (!event.paymentRef || !event.providerPaymentNo) {
    return new NextResponse("MISSING_REF", { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: payment, error: fetchErr } = await admin
    .from("payments")
    .select("*")
    .eq("id", event.paymentRef)
    .maybeSingle();

  if (fetchErr || !payment) {
    return new NextResponse("PAYMENT_NOT_FOUND", { status: 404 });
  }

  // mul_no consistency check — once a payment row has been bound to a PayApp
  // mul_no via createPayment, future webhooks for that ref must match.
  if (
    payment.payapp_mul_no &&
    payment.payapp_mul_no !== event.providerPaymentNo
  ) {
    await logActivity({
      entity_type: "payment",
      entity_id: payment.id,
      action: "webhook_mul_no_mismatch",
      metadata: {
        expected: payment.payapp_mul_no,
        received: event.providerPaymentNo,
      },
    });
    return new NextResponse("MUL_NO_MISMATCH", { status: 400 });
  }

  // Amount check — protect against tampering
  if (event.amount !== null && event.amount !== payment.amount) {
    await logActivity({
      entity_type: "payment",
      entity_id: payment.id,
      action: "webhook_amount_mismatch",
      metadata: { expected: payment.amount, received: event.amount },
    });
    return new NextResponse("AMOUNT_MISMATCH", { status: 400 });
  }

  // Idempotency — already in terminal state with the same outcome
  if (payment.status === "paid" && event.status === "paid") {
    return new NextResponse("SUCCESS");
  }
  if (
    payment.status === "cancelled" &&
    (event.status === "cancelled" || event.status === "failed")
  ) {
    return new NextResponse("SUCCESS");
  }

  // Compute next status
  let nextStatus = payment.status as
    | "pending"
    | "paid"
    | "failed"
    | "cancelled"
    | "refunded";
  const nowIso = new Date().toISOString();
  let paidAt: string | null = payment.paid_at;
  let cancelledAt: string | null = payment.cancelled_at;
  switch (event.status) {
    case "paid":
      nextStatus = "paid";
      paidAt = nowIso;
      break;
    case "cancelled":
      nextStatus = "cancelled";
      cancelledAt = nowIso;
      break;
    case "failed":
      nextStatus = "failed";
      break;
    default:
      // unknown — log but don't change state
      break;
  }

  // Persist payment update
  await admin
    .from("payments")
    .update({
      status: nextStatus,
      paid_at: paidAt,
      cancelled_at: cancelledAt,
      payapp_mul_no: event.providerPaymentNo,
      metadata: {
        ...((payment.metadata as object) ?? {}),
        last_webhook_state: event.rawState,
        last_webhook_at: nowIso,
      },
    })
    .eq("id", payment.id);

  // Side effects on successful payment
  if (event.status === "paid") {
    if (payment.type === "deposit") {
      if (payment.quote_id) {
        await admin
          .from("quotes")
          .update({ payment_status: "deposit_paid" })
          .eq("id", payment.quote_id);
      }
      // Kickoff gate: deposit paid alone does NOT start the project. The
      // project enters 진행중 only when the contract is also signed.
      // tryKickoffForQuote checks both conditions and is idempotent.
      if (payment.quote_id) {
        await tryKickoffForQuote(payment.quote_id);
      }
    } else if (payment.type === "balance") {
      if (payment.quote_id) {
        await admin
          .from("quotes")
          .update({ payment_status: "fully_paid" })
          .eq("id", payment.quote_id);
      }
      if (payment.project_id) {
        await admin
          .from("projects")
          .update({ billing_status: "completed" })
          .eq("id", payment.project_id);
      }
    }
    // type='extra' has no automatic side-effects

    // Sync 문의 목록 상태 (inquiries.status): deposit→진행, balance→완료.
    if (payment.quote_id) {
      await syncInquiryPipelineForQuote(payment.quote_id);
    }
  }

  await logActivity({
    entity_type: "payment",
    entity_id: payment.id,
    action: `webhook_${event.status}`,
    metadata: {
      mul_no: event.providerPaymentNo,
      amount: event.amount,
      raw_state: event.rawState,
    },
  });

  // Customer + staff notifications / email on paid
  if (event.status === "paid") {
    void createNotification(payment.user_id, "payment_paid", {
      payment_id: payment.id,
      type: payment.type,
      amount: payment.amount,
      title: payment.title,
    });
    // Kakao 알림톡 — 예약금 결제 완료 (in_app/email already handled). Best-effort.
    if (payment.type === "deposit") {
      void dispatchKakao({
        userId: payment.user_id,
        type: "deposit_paid",
        payload: { amount: payment.amount, title: payment.title },
      });
    }
    void notifyStaff("payment_paid", {
      payment_id: payment.id,
      type: payment.type,
      amount: payment.amount,
      title: payment.title,
    });

    // Note: the project_started notification is fired by tryKickoffForQuote
    // only when BOTH contract-signed and deposit-paid hold — not on deposit
    // payment alone — so it is intentionally not sent here.
    if (payment.type === "balance" && payment.project_id) {
      void createNotification(payment.user_id, "project_completed", {
        project_id: payment.project_id,
        title: payment.title,
      });
    }

    // Email — best-effort. Look up the customer's email from profiles.
    if (payment.user_id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("name,email,company_name")
        .eq("id", payment.user_id)
        .maybeSingle();
      const recipient = profile?.email ?? null;
      const displayName =
        profile?.name ?? profile?.company_name ?? recipient ?? "고객";
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://studioboda.vercel.app";
      if (recipient) {
        void sendTemplate(recipient, "payment_paid", {
          name: displayName,
          paymentTitle: payment.title,
          amount: payment.amount,
          meUrl: `${siteUrl}/me/projects`,
        });
      }
    }

    // 예약금(deposit) 결제 완료 → 계약서 자동 생성 + 발송 (idempotent).
    // Awaited inside a guard so a failure is logged but never blocks the ack.
    if (payment.type === "deposit" && payment.quote_id) {
      try {
        await provisionContractForPaidDeposit(payment.quote_id);
      } catch (err) {
        await logActivity({
          entity_type: "contract",
          entity_id: null,
          action: "contract_autoprovision_error",
          metadata: {
            quote_id: payment.quote_id,
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }
  }

  // PayApp expects literal "SUCCESS" body to acknowledge.
  return new NextResponse("SUCCESS");
}
