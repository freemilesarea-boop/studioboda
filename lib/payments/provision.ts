// ============================================================
// STUDIO BODA — Payment provisioning core (system context, no auth)
// ============================================================
// Canonical PayApp charge creation shared by the admin server action
// (lib/actions/payments.ts) and the contract-send flow / webhook. These plain
// async functions must NOT call requireStaff — pass actorId explicitly.
// ============================================================

import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { getPaymentProvider } from "@/lib/payments/provider";
import { createNotification } from "@/lib/notifications";
import { sendTemplate } from "@/lib/email/send";
import { depositSplit } from "@/lib/payments/constants";
import type { PaymentType } from "@/lib/types/db";

const SITE_URL = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "https://studioboda.kr").replace(/\/+$/, "");

export type CreatePaymentInput = {
  quoteId: string;
  type: PaymentType;
  title?: string;
  description?: string;
  amount?: number; // only used for type='extra'
};

export type CreatePaymentResult =
  | { ok: true; payUrl: string; paymentId: string }
  | { ok: false; error: string };

/**
 * Create a PayApp charge for a quote. Amounts are computed server-side from the
 * EFFECTIVE deposit rate (legacy 10%/null → 30%). On creating a deposit/balance
 * charge the quote's deposit fields are backfilled so every surface is 30%.
 */
export async function createPaymentCore(
  input: CreatePaymentInput,
  actorId: string | null,
): Promise<CreatePaymentResult> {
  const admin = createAdminSupabase();

  const { data: quote } = await admin
    .from("quotes")
    .select("*")
    .eq("id", input.quoteId)
    .maybeSingle();
  if (!quote) return { ok: false, error: "견적을 찾을 수 없습니다" };

  const totalPrice = (quote.total_price as number) ?? 0;
  const split = depositSplit(totalPrice, quote.deposit_rate as number | null);
  const depositAmount = split.deposit;
  const balanceAmount = split.balance;

  // Keep the quote row consistent with the enforced 30% policy.
  if (
    quote.deposit_rate !== split.rate ||
    quote.deposit_amount !== depositAmount ||
    quote.balance_amount !== balanceAmount
  ) {
    await admin
      .from("quotes")
      .update({
        deposit_rate: split.rate,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,
      })
      .eq("id", quote.id);
  }

  let amount: number;
  let title: string;
  const description: string | null = input.description?.trim() || null;

  if (input.type === "deposit") {
    if (depositAmount <= 0) return { ok: false, error: "예약금 금액이 0원 이하입니다" };
    amount = depositAmount;
    title = `[예약금] ${quote.title}`;
  } else if (input.type === "balance") {
    if (balanceAmount <= 0) return { ok: false, error: "본결제 금액이 0원 이하입니다" };
    amount = balanceAmount;
    title = `[본결제] ${quote.title}`;
  } else {
    if (!input.amount || input.amount <= 0) {
      return { ok: false, error: "추가 결제 금액을 입력해주세요" };
    }
    if (!input.title || !input.title.trim()) {
      return { ok: false, error: "추가 결제 제목을 입력해주세요" };
    }
    amount = Math.round(input.amount);
    title = `[추가결제] ${input.title.trim()}`;
  }

  // Block duplicates of the same type for a quote in a pending/paid state
  if (input.type !== "extra") {
    const { data: dup } = await admin
      .from("payments")
      .select("id,status")
      .eq("quote_id", quote.id)
      .eq("type", input.type)
      .in("status", ["pending", "paid"])
      .maybeSingle();
    if (dup) {
      return {
        ok: false,
        error:
          dup.status === "paid"
            ? `이미 ${input.type === "deposit" ? "예약금" : "본결제"} 결제가 완료되었습니다`
            : `이미 ${input.type === "deposit" ? "예약금" : "본결제"} 결제 청구가 대기 중입니다`,
      };
    }
  }

  // Resolve buyer info (quote.user_id → project → inquiry → profiles by email)
  let userId = (quote.user_id as string | null) ?? null;
  let buyerName = "";
  let buyerEmail = "";
  let buyerPhone = "";

  type LinkedProject = { id: string; billing_status: string | null; user_id: string | null };
  const { data: linkedProjectRow } = await admin
    .from("projects")
    .select("id,billing_status,user_id")
    .eq("quote_id", quote.id)
    .maybeSingle();
  const linkedProject = (linkedProjectRow as LinkedProject | null) ?? null;
  if (!userId && linkedProject?.user_id) userId = linkedProject.user_id;

  let inquiryEmail: string | null = null;
  if (quote.inquiry_id) {
    const { data: inq } = await admin
      .from("inquiries")
      .select("name,email,phone,user_id")
      .eq("id", quote.inquiry_id)
      .maybeSingle();
    if (!userId && inq?.user_id) userId = inq.user_id;
    if (inq) {
      buyerName = inq.name ?? "";
      buyerEmail = inq.email ?? "";
      buyerPhone = inq.phone ?? "";
      inquiryEmail = inq.email ?? null;
    }
  }

  if (!userId && inquiryEmail) {
    const { data: prof } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", inquiryEmail)
      .maybeSingle();
    if (prof?.id) userId = prof.id;
  }

  if (!userId) {
    return {
      ok: false,
      error:
        "이 견적은 고객 계정과 연결되어 있지 않습니다. 먼저 문의/견적을 고객 계정에 연결해주세요.",
    };
  }

  {
    const { data: profile } = await admin
      .from("profiles")
      .select("name,email,phone,contact_phone,company_name")
      .eq("id", userId)
      .maybeSingle();
    if (profile) {
      buyerName = profile.name || profile.company_name || buyerName;
      buyerEmail = profile.email || buyerEmail;
      buyerPhone = profile.phone || profile.contact_phone || buyerPhone;
    }
  }

  if (!quote.user_id) {
    await admin.from("quotes").update({ user_id: userId }).eq("id", quote.id).is("user_id", null);
  }

  if (!buyerPhone) {
    return {
      ok: false,
      error:
        "고객 전화번호가 없습니다. 회원 프로필 또는 문의에 전화번호를 먼저 채워주세요.",
    };
  }

  const { data: payment, error: insErr } = await admin
    .from("payments")
    .insert({
      quote_id: quote.id,
      project_id: linkedProject?.id ?? null,
      user_id: userId,
      type: input.type,
      title,
      description,
      amount,
      status: "pending",
    })
    .select("*")
    .single();
  if (insErr || !payment) {
    return { ok: false, error: insErr?.message ?? "결제 청구 생성 실패" };
  }

  const provider = getPaymentProvider();
  const result = await provider.createPayment({
    orderRef: payment.id,
    goodName: title,
    price: amount,
    buyerName,
    buyerEmail,
    buyerPhone,
    returnUrl: `${SITE_URL()}/me/payments?return=1`,
    feedbackUrl: `${SITE_URL()}/api/payapp/webhook`,
  });

  if (!result.ok) {
    await admin
      .from("payments")
      .update({
        status: "failed",
        metadata: { provider: provider.name, error: result.error, raw: result.raw ?? null },
      })
      .eq("id", payment.id);
    await logActivity({
      actor_id: actorId,
      entity_type: "payment",
      entity_id: payment.id,
      action: "create_failed",
      metadata: { error: result.error },
    });
    return { ok: false, error: result.error };
  }

  await admin
    .from("payments")
    .update({
      payapp_mul_no: result.providerPaymentNo,
      payapp_payurl: result.payUrl,
      payapp_qrurl: result.qrUrl ?? null,
      metadata: { provider: provider.name },
    })
    .eq("id", payment.id);

  if (input.type === "balance" && linkedProject) {
    await admin
      .from("projects")
      .update({ billing_status: "waiting_balance" })
      .eq("id", linkedProject.id);
  }

  await logActivity({
    actor_id: actorId,
    entity_type: "payment",
    entity_id: payment.id,
    action: "created",
    metadata: { type: input.type, amount, quote_id: quote.id },
  });

  void createNotification(userId, "payment_requested", {
    payment_id: payment.id,
    type: input.type,
    amount,
    title,
    pay_url: result.payUrl,
  });

  const { data: profileForEmail } = await admin
    .from("profiles")
    .select("email,name,company_name")
    .eq("id", userId)
    .maybeSingle();
  const recipient = profileForEmail?.email ?? buyerEmail;
  if (recipient) {
    void sendTemplate(recipient, "payment_requested", {
      name: profileForEmail?.name ?? profileForEmail?.company_name ?? buyerName,
      paymentTitle: title,
      amount,
      payUrl: result.payUrl,
    });
  }

  return { ok: true, payUrl: result.payUrl, paymentId: payment.id };
}

export type DepositChargeInfo = {
  status: "paid" | "pending" | "none";
  payUrl: string | null;
  amount: number | null;
};

/**
 * Ensure a deposit charge exists for the quote (used when sending a contract).
 * Returns the existing deposit's state, or creates one and returns its pay URL.
 * Never throws.
 */
export async function ensureDepositPaymentForQuote(
  quoteId: string,
  actorId: string | null,
): Promise<DepositChargeInfo> {
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("payments")
    .select("id,status,amount,payapp_payurl")
    .eq("quote_id", quoteId)
    .eq("type", "deposit")
    .in("status", ["pending", "paid"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      status: existing.status === "paid" ? "paid" : "pending",
      payUrl: (existing.payapp_payurl as string | null) ?? null,
      amount: (existing.amount as number | null) ?? null,
    };
  }

  const created = await createPaymentCore({ quoteId, type: "deposit" }, actorId);
  if (!created.ok) {
    await logActivity({
      entity_type: "payment",
      entity_id: null,
      action: "deposit_autocreate_failed",
      metadata: { quote_id: quoteId, error: created.error },
    });
    return { status: "none", payUrl: null, amount: null };
  }
  // Read back the amount for the email summary.
  const { data: row } = await admin
    .from("payments")
    .select("amount")
    .eq("id", created.paymentId)
    .maybeSingle();
  return {
    status: "pending",
    payUrl: created.payUrl,
    amount: (row?.amount as number | null) ?? null,
  };
}
