"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { getProfile, requireStaff } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments/provider";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { sendAuditedEmail } from "@/lib/email/audited";
import { depositSplit } from "@/lib/payments/constants";
import { syncInquiryPipelineForQuote } from "@/lib/actions/crm";
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
  // Enforce the 30% deposit policy (legacy 10%/null → 30%) and backfill the
  // quote so admin/customer/contract/receipt surfaces all show 30%.
  const split = depositSplit(totalPrice, quote.deposit_rate as number | null);
  const depositAmount = split.deposit;
  const balanceAmount = split.balance;
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

  // Resolve buyer info — every payment must belong to a real customer profile.
  // Priority: quote.user_id → linked project.user_id → inquiry.user_id →
  // profiles lookup by inquiry/quote email. If none resolves, we block.
  let userId = (quote.user_id as string | null) ?? null;
  let buyerName = "";
  let buyerEmail = "";
  let buyerPhone = "";

  // 1) Linked project — covers the case where a quote was issued before the
  //    customer signed up but a project was already created for them.
  type LinkedProject = {
    id: string;
    billing_status: string | null;
    user_id: string | null;
  };
  const { data: linkedProjectRow } = await admin
    .from("projects")
    .select("id,billing_status,user_id")
    .eq("quote_id", quote.id)
    .maybeSingle();
  const linkedProject = (linkedProjectRow as LinkedProject | null) ?? null;
  if (!userId && linkedProject?.user_id) userId = linkedProject.user_id;

  // 2) Inquiry on the quote
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

  // 3) Fall back to a profiles lookup by inquiry email
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
      ok: false as const,
      error:
        "이 견적은 고객 계정과 연결되어 있지 않습니다. 먼저 문의/견적을 고객 계정에 연결해주세요.",
    };
  }

  // We have a real customer — pull authoritative buyer info from their profile
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

  // Backfill quote.user_id so the same lookup never has to run again
  if (!quote.user_id) {
    await admin
      .from("quotes")
      .update({ user_id: userId })
      .eq("id", quote.id)
      .is("user_id", null);
  }

  if (!buyerPhone) {
    return {
      ok: false as const,
      error:
        "고객 전화번호가 없습니다. 회원 프로필 또는 문의에 전화번호를 먼저 채워주세요.",
    };
  }

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

  // Notify customer in-app + email (fire-and-forget)
  if (userId) {
    void createNotification(userId, "payment_requested", {
      payment_id: payment.id,
      type: input.type,
      amount,
      title,
      pay_url: result.payUrl,
    });
  }
  if (buyerEmail) {
    void sendAuditedEmail({
      to: buyerEmail,
      template: "payment_requested",
      data: {
        name: buyerName || buyerEmail,
        paymentTitle: title,
        amount,
        payUrl: result.payUrl,
      },
      eventType: "payment_requested",
      userId,
      party: "client",
    });
  }

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

export async function cancelPaymentAction(paymentId: string, reason: string) {
  const me = await requireStaff();
  const trimmed = (reason || "").trim().slice(0, 500);
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
      error: "이미 완료된 결제는 환불 절차로 처리해주세요",
    };
  }
  if (payment.status === "cancelled") {
    return { ok: false as const, error: "이미 취소된 결제입니다" };
  }

  if (payment.payapp_mul_no) {
    const provider = getPaymentProvider();
    if (provider.cancelPayment) {
      const r = await provider.cancelPayment(
        payment.payapp_mul_no,
        trimmed || "admin cancel",
      );
      if (!r.ok) {
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
      cancel_reason: trimmed || null,
    })
    .eq("id", paymentId);

  await logActivity({
    actor_id: me.id,
    entity_type: "payment",
    entity_id: paymentId,
    action: "cancelled",
    metadata: { type: payment.type, amount: payment.amount, reason: trimmed },
  });

  if (payment.user_id) {
    void createNotification(payment.user_id, "payment_failed", {
      payment_id: paymentId,
      title: payment.title,
      reason: trimmed || null,
      action: "cancelled",
    });
  }

  revalidatePath("/admin/payments");
  revalidatePath("/me/payments");
  return { ok: true as const };
}

// Refund. PayApp `paycancel` is the source of truth: the DB is marked
// `refunded` ONLY when the provider cancel succeeds (or there is no PayApp
// transaction to cancel, i.e. a manual payment). If the provider fails we keep
// the existing status, log `refund_provider_failed`, alert staff, and return an
// error — so the site never shows "refunded" for money that wasn't returned.
export async function refundPaymentAction(paymentId: string, reason: string) {
  const me = await requireStaff();
  const trimmed = (reason || "").trim().slice(0, 500);
  if (!trimmed) {
    return { ok: false as const, error: "환불 사유를 입력해주세요" };
  }
  const admin = createAdminSupabase();
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment)
    return { ok: false as const, error: "결제를 찾을 수 없습니다" };
  if (payment.status !== "paid") {
    // 이미 failed/cancelled/refunded → provider 호출하지 않고 skip.
    return {
      ok: false as const,
      error: "결제 완료 상태인 청구만 환불 가능합니다",
    };
  }

  // PayApp cancel — must succeed before we touch the DB. A payment with no
  // mul_no is a manual/offline record (no PG charge), so it can be refunded
  // operationally without a provider call.
  let providerOk: boolean;
  let providerNote: string;
  if (payment.payapp_mul_no) {
    const provider = getPaymentProvider();
    if (!provider.cancelPayment) {
      providerOk = false;
      providerNote = "provider_unavailable";
    } else {
      const r = await provider.cancelPayment(payment.payapp_mul_no, trimmed);
      providerOk = r.ok;
      providerNote = r.ok ? "provider_cancelled" : `provider_failed:${r.error ?? ""}`;
    }
  } else {
    providerOk = true;
    providerNote = "manual_no_mul_no";
  }

  // ── Provider FAILED → do NOT mark refunded. Keep status, alert ops. ──
  if (!providerOk) {
    await logActivity({
      actor_id: me.id,
      entity_type: "payment",
      entity_id: paymentId,
      action: "refund_provider_failed",
      metadata: {
        type: payment.type,
        amount: payment.amount,
        reason: trimmed,
        provider: providerNote,
        status_kept: payment.status,
      },
    });
    void notifyStaff("payment_failed", {
      payment_id: paymentId,
      title: payment.title,
      refund_failed: true,
      reason: trimmed,
      provider: providerNote,
    });
    return {
      ok: false as const,
      error:
        "PayApp 환불에 실패해 DB 상태를 변경하지 않았습니다. PayApp 콘솔에서 직접 확인/환불하세요.",
    };
  }

  // ── Provider OK → mark refunded + reverse downstream. ──
  await admin
    .from("payments")
    .update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
      refund_reason: trimmed,
    })
    .eq("id", paymentId);

  // Reverse side-effects on the linked quote/project
  if (payment.type === "deposit" && payment.quote_id) {
    await admin
      .from("quotes")
      .update({ payment_status: "unpaid" })
      .eq("id", payment.quote_id);
    if (payment.project_id) {
      await admin
        .from("projects")
        .update({ billing_status: "waiting_deposit" })
        .eq("id", payment.project_id);
    }
  } else if (payment.type === "balance" && payment.quote_id) {
    await admin
      .from("quotes")
      .update({ payment_status: "deposit_paid" })
      .eq("id", payment.quote_id);
    if (payment.project_id) {
      await admin
        .from("projects")
        .update({ billing_status: "in_progress" })
        .eq("id", payment.project_id);
    }
  }

  // Re-sync the inquiry pipeline from the now-updated ledger (refund downgrades
  // 진행/완료 back toward 견적 발송 when no active paid remains).
  if (payment.quote_id) {
    await syncInquiryPipelineForQuote(payment.quote_id, { actorId: me.id });
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "payment",
    entity_id: paymentId,
    action: "refunded",
    metadata: {
      type: payment.type,
      amount: payment.amount,
      reason: trimmed,
      provider: providerNote,
    },
  });

  if (payment.user_id) {
    void createNotification(payment.user_id, "payment_failed", {
      payment_id: paymentId,
      title: payment.title,
      reason: trimmed,
      action: "refunded",
    });
  }

  revalidatePath("/admin/payments");
  revalidatePath("/me/payments");
  return { ok: true as const, providerNote };
}

// ---- Customer: request a tax invoice (세금계산서) or cash receipt (현금영수증) ----
//
// We do not yet integrate a tax-invoice issuer (e.g. Barobill / Popbill), so
// this records the request on the payment's metadata and notifies staff, who
// issue the document out-of-band and mark it issued. Idempotent: a second
// request while one is pending/issued is a no-op success.
type TaxDocType = "tax_invoice" | "cash_receipt";

export type TaxDocState = {
  type: TaxDocType;
  status: "requested" | "issued";
  requested_at: string;
  issued_at?: string;
};

export async function requestTaxDocumentAction(formData: FormData) {
  const me = await getProfile();
  if (!me) return { ok: false as const, error: "로그인이 필요합니다" };

  const paymentId = String(formData.get("payment_id") ?? "").trim();
  const docTypeRaw = String(formData.get("doc_type") ?? "").trim();
  const docType: TaxDocType =
    docTypeRaw === "cash_receipt" ? "cash_receipt" : "tax_invoice";
  if (!paymentId) return { ok: false as const, error: "결제 정보가 없습니다" };

  const admin = createAdminSupabase();
  const { data: payment } = await admin
    .from("payments")
    .select("id, user_id, title, amount, status, metadata")
    .eq("id", paymentId)
    .eq("user_id", me.id)
    .maybeSingle();
  if (!payment) return { ok: false as const, error: "결제를 찾을 수 없습니다" };
  if (payment.status !== "paid") {
    return {
      ok: false as const,
      error: "결제가 완료된 건만 증빙을 요청할 수 있습니다",
    };
  }

  const metadata = (payment.metadata ?? {}) as Record<string, unknown>;
  const existing = metadata.tax_doc as TaxDocState | undefined;
  if (existing && (existing.status === "requested" || existing.status === "issued")) {
    // Already requested or issued — surface success without re-notifying.
    return { ok: true as const, alreadyRequested: true };
  }

  const taxDoc: TaxDocState = {
    type: docType,
    status: "requested",
    requested_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("payments")
    .update({ metadata: { ...metadata, tax_doc: taxDoc } })
    .eq("id", paymentId);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "payment",
    entity_id: paymentId,
    action: "tax_document_requested",
    metadata: { doc_type: docType, title: payment.title, amount: payment.amount },
  });

  void notifyStaff("tax_document_requested", {
    payment_id: paymentId,
    user_id: me.id,
    doc_type: docType,
    title: payment.title,
    amount: payment.amount,
  });

  revalidatePath("/me/payments");
  return { ok: true as const };
}

// ---- Admin: read-only PayApp status lookup (no DB state change) -------------
// PayApp state(pay_state) → 관리자 표시용 한글 라벨. (payapp.ts stateToStatus와
// 동일 매핑: 4=완료, 9=취소, 64/65/70=실패)
const PAYAPP_STATE_LABELS: Record<string, string> = {
  "1": "결제요청/대기",
  "4": "결제완료",
  "9": "취소/환불",
  "64": "만료/실패",
  "65": "결제거절",
  "70": "결제실패",
};

/**
 * Read-only PayApp status check for a single payment. Calls PayApp `paycheck`
 * and returns the authoritative provider state alongside the local DB status.
 * Does NOT mutate payment/quote/project. Audits to activity_logs. Staff only.
 * No keys/secrets are returned (queryPaymentStatus exposes only state/amount).
 */
export async function checkPayAppPaymentStatusAction(paymentId: string) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: payment } = await admin
    .from("payments")
    .select("id, status, amount, payapp_mul_no, title")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return { ok: false as const, error: "결제를 찾을 수 없습니다" };
  if (!payment.payapp_mul_no) {
    return { ok: false as const, error: "PayApp 거래번호(mul_no)가 없어 조회할 수 없습니다" };
  }

  const provider = getPaymentProvider();
  if (!provider.queryPaymentStatus) {
    return { ok: false as const, error: "상태 조회를 지원하지 않는 결제 제공자입니다" };
  }

  const q = await provider.queryPaymentStatus(payment.payapp_mul_no);
  if (!q.ok) {
    return { ok: false as const, error: q.error ?? "PayApp 상태 조회 실패" };
  }

  const rawState = q.rawState ?? "";
  const label = PAYAPP_STATE_LABELS[rawState] ?? "알 수 없음";
  const localStatus = payment.status as string;
  const providerPaid = q.status === "paid";
  const localPaid = localStatus === "paid";
  // 핵심 위험: PayApp는 결제완료인데 로컬은 paid가 아닌 경우(미환불 가능성).
  const mismatch = providerPaid !== localPaid;

  await logActivity({
    actor_id: me.id,
    entity_type: "payment",
    entity_id: paymentId,
    action: "payapp_status_checked",
    metadata: {
      mul_no: payment.payapp_mul_no,
      provider_state: rawState,
      provider_status: q.status,
      local_status: localStatus,
      mismatch,
    },
  });

  return {
    ok: true as const,
    mul_no: payment.payapp_mul_no,
    current_local_status: localStatus,
    provider_state: rawState,
    provider_state_label: label,
    provider_status: q.status,
    provider_amount: q.amount ?? null,
    amount_match: q.amount == null ? null : q.amount === payment.amount,
    provider_raw_summary: `state=${rawState || "?"} · mapped=${q.status} · amount=${q.amount ?? "—"}`,
    mismatch,
    checked_at: new Date().toISOString(),
  };
}
