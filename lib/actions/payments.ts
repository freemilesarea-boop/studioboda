"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments/provider";
import type { PaymentType } from "@/lib/types/db";

const SITE_URL = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://studioboda.vercel.app";

type CreateInput = {
  quoteId: string;
  type: PaymentType;
  title?: string;
  description?: string;
  amount?: number; // only used for type='extra'
};

export async function createPaymentAction(input: CreateInput) {
  const me = await requireStaff();
  const admin = createAdminSupabase();

  const { data: quote } = await admin
    .from("quotes")
    .select("*")
    .eq("id", input.quoteId)
    .maybeSingle();
  if (!quote) return { ok: false as const, error: "견적을 찾을 수 없습니다" };

  const totalPrice = (quote.total_price as number) ?? 0;
  const depositRate = (quote.deposit_rate ?? 10) as number;
  const depositAmount = Math.round((totalPrice * depositRate) / 100);
  const balanceAmount = totalPrice - depositAmount;

  // Server-side amount computation. Never trust the client.
  let amount: number;
  let title: string;
  let description: string | null = input.description?.trim() || null;

  if (input.type === "deposit") {
    if (depositAmount <= 0) {
      return { ok: false as const, error: "예약금 금액이 0원 이하입니다" };
    }
    amount = depositAmount;
    title = `[예약금] ${quote.title}`;
  } else if (input.type === "balance") {
    if (balanceAmount <= 0) {
      return { ok: false as const, error: "본결제 금액이 0원 이하입니다" };
    }
    amount = balanceAmount;
    title = `[본결제] ${quote.title}`;
  } else {
    if (!input.amount || input.amount <= 0) {
      return { ok: false as const, error: "추가 결제 금액을 입력해주세요" };
    }
    if (!input.title || !input.title.trim()) {
      return { ok: false as const, error: "추가 결제 제목을 입력해주세요" };
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
        ok: false as const,
        error:
          dup.status === "paid"
            ? `이미 ${input.type === "deposit" ? "예약금" : "본결제"} 결제가 완료되었습니다`
            : `이미 ${input.type === "deposit" ? "예약금" : "본결제"} 결제 청구가 대기 중입니다`,
      };
    }
  }

  // Resolve buyer info
  const userId = (quote.user_id as string | null) ?? null;
  let buyerName = "";
  let buyerEmail = "";
  let buyerPhone = "";
  if (userId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("name,email,phone,contact_phone,company_name")
      .eq("id", userId)
      .maybeSingle();
    buyerName = profile?.name || profile?.company_name || "";
    buyerEmail = profile?.email || "";
    buyerPhone = profile?.phone || profile?.contact_phone || "";
  } else if (quote.inquiry_id) {
    const { data: inq } = await admin
      .from("inquiries")
      .select("name,email,phone")
      .eq("id", quote.inquiry_id)
      .maybeSingle();
    buyerName = inq?.name ?? "";
    buyerEmail = inq?.email ?? "";
    buyerPhone = inq?.phone ?? "";
  }
  if (!buyerPhone) {
    return {
      ok: false as const,
      error:
        "고객 전화번호가 없습니다. 회원 프로필 또는 문의에 전화번호를 먼저 채워주세요.",
    };
  }

  // Linked project (if quote already converted into one)
  const { data: linkedProject } = await admin
    .from("projects")
    .select("id,billing_status")
    .eq("quote_id", quote.id)
    .maybeSingle();

  // Insert payment row first so we have a stable ref for PayApp
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
    return {
      ok: false as const,
      error: insErr?.message ?? "결제 청구 생성 실패",
    };
  }

  // Provider call
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
      actor_id: me.id,
      entity_type: "payment",
      entity_id: payment.id,
      action: "create_failed",
      metadata: { error: result.error },
    });
    return { ok: false as const, error: result.error };
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

  // Side effects: balance issued → project enters "waiting_balance"
  if (input.type === "balance" && linkedProject) {
    await admin
      .from("projects")
      .update({ billing_status: "waiting_balance" })
      .eq("id", linkedProject.id);
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "payment",
    entity_id: payment.id,
    action: "created",
    metadata: {
      type: input.type,
      amount,
      quote_id: quote.id,
      mul_no: result.providerPaymentNo,
    },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  revalidatePath("/me/payments");
  revalidatePath("/me");
  if (linkedProject) revalidatePath(`/admin/projects/${linkedProject.id}`);

  return {
    ok: true as const,
    paymentId: payment.id,
    payUrl: result.payUrl,
    qrUrl: result.qrUrl,
  };
}

export async function cancelPaymentAction(paymentId: string) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment)
    return { ok: false as const, error: "결제를 찾을 수 없습니다" };
  if (payment.status === "paid") {
    return {
      ok: false as const,
      error: "이미 완료된 결제는 환불 절차가 필요합니다",
    };
  }
  if (payment.status === "cancelled") {
    return { ok: false as const, error: "이미 취소된 결제입니다" };
  }

  // Try provider-side cancel if we have a mul_no
  if (payment.payapp_mul_no) {
    const provider = getPaymentProvider();
    if (provider.cancelPayment) {
      const r = await provider.cancelPayment(payment.payapp_mul_no, "admin cancel");
      if (!r.ok) {
        // We still want to mark locally cancelled — log the provider error.
        await logActivity({
          actor_id: me.id,
          entity_type: "payment",
          entity_id: paymentId,
          action: "provider_cancel_failed",
          metadata: { error: r.error },
        });
      }
    }
  }

  await admin
    .from("payments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  await logActivity({
    actor_id: me.id,
    entity_type: "payment",
    entity_id: paymentId,
    action: "cancelled",
    metadata: { type: payment.type, amount: payment.amount },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/me/payments");
  return { ok: true as const };
}
