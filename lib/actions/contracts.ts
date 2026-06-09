"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff, getProfile } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { setLeadStatusForInquiry } from "@/lib/actions/crm";
import { tryKickoffForQuote } from "@/lib/projects/kickoff";
import {
  contractTitleFor,
  defaultRevisionCount,
  scopeToTemplateKind,
  type ServiceScopeKey,
} from "@/lib/contracts/templates";
import { DEFAULT_DEPOSIT_RATE, depositSplit } from "@/lib/payments/constants";
import type { ContractComposeFacts } from "@/lib/contracts/engine";
import {
  composeBody,
  composeFactsFromQuote,
  emailContractToParties,
  ensureContractForQuote,
  sendContractIfDraft,
  type QuoteRow,
} from "@/lib/contracts/provisioning";
import { ensureDepositPaymentForQuote } from "@/lib/payments/provision";
import { sendAuditedEmail } from "@/lib/email/audited";
import { siteUrl } from "@/lib/company";
import type { Contract } from "@/lib/types/db";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

// ---- Admin: generate a contract from an (accepted) quote ----
export async function createContractFromQuoteAction(
  quoteId: string,
): Promise<Result<{ contract_id: string }>> {
  const me = await requireStaff();
  // Delegates to the shared, idempotent provisioning helper (same logic the
  // webhook uses). Returns the existing contract if one already exists.
  const r = await ensureContractForQuote(quoteId, { actorId: me.id });
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath("/admin/contracts");
  return { ok: true, contract_id: r.contractId };
}

// ---- Admin: 견적·계약·예약금 통합 발송 (single button) ----
// One action that runs the whole send flow in order:
//   1) 견적 조회·고객 확인 (ensureContractForQuote 내부)
//   2) 계약서 없으면 생성 (+ contract_versions v1)
//   3) 예약금 결제 없으면 생성 (sendContractIfDraft → ensureDepositPaymentForQuote)
//   4) 계약서 draft면 sent 처리
//   5) 견적서·계약서·예약금 결제 링크를 담은 통합 이메일을 을(고객)+갑(전원)에 발송
//   6) 통합 notification 생성 + activity_logs 기록
// 멱등: 계약서/예약금 중복 생성 없음. 이미 발송된 계약이면 이메일만 재발송.
export async function sendQuotePackageAction(
  quoteId: string,
): Promise<Result<{ contract_id: string; resent: boolean }>> {
  const me = await requireStaff();

  // 1~2) 계약서 보장 (idempotent)
  const ensured = await ensureContractForQuote(quoteId, { actorId: me.id });
  if (!ensured.ok) return { ok: false, error: ensured.error };

  // 3~6) draft면 발송(예약금 보장 + 통합 이메일 + 알림). 이미 발송됐으면 이메일만 재발송.
  const sent = await sendContractIfDraft(ensured.contractId, { actorId: me.id });
  if (!sent.ok) return { ok: false, error: sent.error ?? "발송 실패" };

  let resent = false;
  if (!sent.sent) {
    // 이미 sent/viewed/signed — 이메일만 재발송 (중복 생성 없음)
    const re = await resendContractEmailAction(ensured.contractId);
    if (!re.ok) return { ok: false, error: re.error };
    resent = true;
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "quote",
    entity_id: quoteId,
    action: "quote_package_sent",
    metadata: { contract_id: ensured.contractId, resent },
  });

  revalidatePath("/admin/contracts");
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/me/contracts");
  return { ok: true, contract_id: ensured.contractId, resent };
}

// ---- Admin: save an edited draft → bumps version ----
export async function saveContractDraftAction(
  id: string,
  input: { title?: string; body?: string; amount?: number; expires_at?: string | null },
): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: c } = await admin.from("contracts").select("*").eq("id", id).maybeSingle();
  if (!c) return { ok: false, error: "계약서를 찾을 수 없습니다" };
  const contract = c as Contract;
  if (contract.status === "signed") {
    return { ok: false, error: "이미 서명 완료된 계약은 수정할 수 없습니다" };
  }

  const nextVersion = contract.current_version + 1;
  const title = input.title?.trim() || contract.title;
  const body = input.body ?? contract.body;
  const amount = Number.isFinite(input.amount) ? Number(input.amount) : contract.amount;

  const { error } = await admin
    .from("contracts")
    .update({
      title,
      body,
      amount,
      expires_at: input.expires_at ?? contract.expires_at,
      current_version: nextVersion,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await admin.from("contract_versions").insert({
    contract_id: id,
    version: nextVersion,
    title,
    body,
    amount,
    snapshot: { edited_by: me.id },
    created_by: me.id,
  });

  await logActivity({
    actor_id: me.id,
    entity_type: "contract",
    entity_id: id,
    action: "contract_version_saved",
    metadata: { version: nextVersion },
  });
  revalidatePath(`/admin/contracts/${id}`);
  return { ok: true };
}

// ---- Admin: send to customer (계약서 + 예약금 청구 동시 발송) ----
// Delegates to the shared send flow: guards against double-send (draft only),
// ensures a deposit charge exists, and emails both 을(고객) and 갑(관리자 전원).
export async function sendContractAction(id: string): Promise<Result> {
  const me = await requireStaff();
  const r = await sendContractIfDraft(id, { actorId: me.id });
  if (!r.ok) return { ok: false, error: r.error ?? "발송 실패" };
  if (!r.sent) {
    return { ok: false, error: "이미 발송된 계약이거나 발송할 수 없는 상태입니다" };
  }
  revalidatePath(`/admin/contracts/${id}`);
  revalidatePath("/me/contracts");
  return { ok: true };
}

// ---- Admin: re-send an already-sent contract email (no status change) ----
// `sendContractAction` only fires for drafts (idempotent first send). Re-sending
// re-delivers the email (with the deposit pay link) to 을 + 갑 without resetting
// the lifecycle.
export async function resendContractEmailAction(id: string): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: c } = await admin
    .from("contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!c) return { ok: false, error: "계약서를 찾을 수 없습니다" };
  const contract = c as Contract;
  if (!contract.client_id) {
    return { ok: false, error: "계약서에 연결된 고객 계정이 없습니다" };
  }
  if (contract.status === "draft") {
    return { ok: false, error: "아직 발송되지 않은 계약입니다. '계약서 발송'을 먼저 사용하세요" };
  }
  if (["cancelled", "expired"].includes(contract.status)) {
    return { ok: false, error: "취소·만료된 계약은 재발송할 수 없습니다" };
  }

  // Ensure a deposit charge exists; include its pay link unless already paid.
  let payUrl: string | null = null;
  if (contract.quote_id) {
    const dep = await ensureDepositPaymentForQuote(contract.quote_id, me.id);
    payUrl = dep.status === "paid" ? null : dep.payUrl;
  }

  await emailContractToParties(
    {
      id: contract.id,
      title: contract.title,
      amount: contract.amount,
      client_id: contract.client_id,
      contract_number: contract.contract_number,
      quote_id: contract.quote_id,
    },
    { payUrl },
  );

  await logActivity({
    actor_id: me.id,
    entity_type: "contract",
    entity_id: id,
    action: "contract_resent",
  });
  revalidatePath(`/admin/contracts/${id}`);
  return { ok: true };
}

// ---- Admin: cancel ----
export async function cancelContractAction(id: string): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: c } = await admin.from("contracts").select("status").eq("id", id).maybeSingle();
  if (!c) return { ok: false, error: "계약서를 찾을 수 없습니다" };
  await admin.from("contracts").update({ status: "cancelled" }).eq("id", id);
  await logActivity({ actor_id: me.id, entity_type: "contract", entity_id: id, action: "contract_cancelled" });
  revalidatePath(`/admin/contracts/${id}`);
  return { ok: true };
}

// ---- Admin: sign (counter-signature) ----
export async function adminSignContractAction(
  id: string,
  signature: string,
): Promise<Result> {
  const me = await requireStaff();
  if (!signature?.startsWith("data:image")) {
    return { ok: false, error: "서명 이미지가 올바르지 않습니다" };
  }
  const admin = createAdminSupabase();
  const { data: c } = await admin.from("contracts").select("*").eq("id", id).maybeSingle();
  if (!c) return { ok: false, error: "계약서를 찾을 수 없습니다" };
  const contract = c as Contract;
  const now = new Date().toISOString();
  const bothSigned = Boolean(contract.client_signature);

  await admin
    .from("contracts")
    .update({
      admin_signature: signature,
      admin_signed_at: now,
      status: bothSigned ? "signed" : contract.status,
      signed_at: bothSigned ? contract.signed_at ?? now : contract.signed_at,
    })
    .eq("id", id);

  await logActivity({ actor_id: me.id, entity_type: "contract", entity_id: id, action: "contract_admin_signed" });
  if (bothSigned && contract.client_id) {
    void createNotification(contract.client_id, "contract_signed", {
      contract_id: id,
      contract_number: contract.contract_number,
    });
  }
  revalidatePath(`/admin/contracts/${id}`);
  revalidatePath("/me/contracts");
  return { ok: true };
}

// ---- Customer: mark viewed ----
export async function markContractViewedAction(id: string): Promise<Result> {
  const me = await getProfile();
  if (!me) return { ok: false, error: "로그인이 필요합니다" };
  const admin = createAdminSupabase();
  const { data: c } = await admin
    .from("contracts")
    .select("status, viewed_at")
    .eq("id", id)
    .eq("client_id", me.id)
    .maybeSingle();
  if (!c) return { ok: false, error: "계약서를 찾을 수 없습니다" };
  if (!c.viewed_at && (c.status === "sent" || c.status === "draft")) {
    await admin
      .from("contracts")
      .update({ status: c.status === "sent" ? "viewed" : c.status, viewed_at: new Date().toISOString() })
      .eq("id", id);
    void notifyStaff("contract_viewed", { contract_id: id });
  }
  return { ok: true };
}

// ---- Customer: sign ----
export async function signContractAction(
  id: string,
  signature: string,
): Promise<Result> {
  const me = await getProfile();
  if (!me) return { ok: false, error: "로그인이 필요합니다" };
  if (!signature?.startsWith("data:image")) {
    return { ok: false, error: "서명 이미지가 올바르지 않습니다" };
  }
  const admin = createAdminSupabase();
  const { data: c } = await admin
    .from("contracts")
    .select("*")
    .eq("id", id)
    .eq("client_id", me.id)
    .maybeSingle();
  if (!c) return { ok: false, error: "계약서를 찾을 수 없습니다" };
  const contract = c as Contract;
  if (contract.status === "cancelled" || contract.status === "expired") {
    return { ok: false, error: "서명할 수 없는 상태의 계약입니다" };
  }
  if (contract.client_signature) {
    return { ok: false, error: "이미 서명하셨습니다" };
  }

  const now = new Date().toISOString();
  const bothSigned = Boolean(contract.admin_signature);
  await admin
    .from("contracts")
    .update({
      client_signature: signature,
      signed_at: now,
      status: bothSigned ? "signed" : "viewed",
    })
    .eq("id", id);

  await logActivity({
    actor_id: me.id,
    entity_type: "contract",
    entity_id: id,
    action: "contract_client_signed",
  });
  void notifyStaff("contract_signed", {
    contract_id: id,
    contract_number: contract.contract_number,
    client_id: me.id,
  });

  // Advance the linked lead to contract_signed
  if (contract.quote_id) {
    const { data: q } = await admin
      .from("quotes")
      .select("inquiry_id")
      .eq("id", contract.quote_id)
      .maybeSingle();
    if (q?.inquiry_id) {
      void setLeadStatusForInquiry(q.inquiry_id as string, "contract_signed", me.id);
    }
    // Kickoff gate: if the deposit is already paid, signing now satisfies both
    // conditions → move the project to 진행중. Idempotent (no-op otherwise).
    await tryKickoffForQuote(contract.quote_id);
  }

  revalidatePath("/me/contracts");
  revalidatePath(`/me/contracts/${id}`);
  return { ok: true };
}

// ---- Admin: 재생성/업무범위 변경 (regenerate body as a new version) ----
// The title is always 용역계약서; this regenerates the body from the linked
// quote. Optionally overrides the 업무 범위(서비스 분류) when scopeOverride is
// given. Signed contracts are locked.
export async function changeContractTemplateAction(
  id: string,
  scopeOverride?: ServiceScopeKey,
): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: c } = await admin.from("contracts").select("*").eq("id", id).maybeSingle();
  if (!c) return { ok: false, error: "계약서를 찾을 수 없습니다" };
  const contract = c as Contract;
  if (contract.status === "signed") {
    return { ok: false, error: "이미 서명 완료된 계약은 변경할 수 없습니다" };
  }

  let customerName = "고객";
  if (contract.client_id) {
    const { data: p } = await admin
      .from("profiles")
      .select("name, company_name")
      .eq("id", contract.client_id)
      .maybeSingle();
    customerName = p?.company_name || p?.name || customerName;
  }

  let projectTitle = contract.title.replace(/^용역계약서\s*·\s*/, "").replace(/^\[[^\]]*\]\s*/, "");
  let facts: ContractComposeFacts | null = null;
  if (contract.quote_id) {
    const { data: q } = await admin
      .from("quotes")
      .select(
        "id,title,service_type,total_price,deposit_rate,deposit_amount,balance_amount,delivery_days,user_id,inquiry_id,options",
      )
      .eq("id", contract.quote_id)
      .maybeSingle();
    if (q) {
      facts = composeFactsFromQuote(q as QuoteRow, customerName);
      projectTitle = q.title as string;
    }
  }
  if (!facts) {
    const amount = contract.amount;
    const split = depositSplit(amount, DEFAULT_DEPOSIT_RATE);
    const scope = scopeOverride ?? "etc";
    const kind = scopeToTemplateKind(scope);
    facts = {
      kind,
      customerName,
      projectTitle,
      serviceType: null,
      amount,
      depositRate: split.rate,
      depositAmount: split.deposit,
      balanceAmount: split.balance,
      monthlyAmount: amount,
      deliveryDays: null,
      revisionCount: defaultRevisionCount(kind),
      deliverables: [],
      recurring: kind === "maintenance",
      scopeKey: scope,
    };
  }
  // Apply scope override if the admin chose a specific work-scope.
  if (scopeOverride) {
    facts = { ...facts, scopeKey: scopeOverride, kind: scopeToTemplateKind(scopeOverride), recurring: scopeOverride === "maintenance" };
  }

  const title = contractTitleFor(facts.kind, projectTitle);
  const body = await composeBody(facts);
  const nextVersion = contract.current_version + 1;

  const { error } = await admin
    .from("contracts")
    .update({ template_kind: facts.kind, title, body, current_version: nextVersion })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await admin.from("contract_versions").insert({
    contract_id: id,
    version: nextVersion,
    title,
    body,
    amount: contract.amount,
    snapshot: { scope: facts.scopeKey, changed_by: me.id, source: "regenerate" },
    created_by: me.id,
  });

  await logActivity({
    actor_id: me.id,
    entity_type: "contract",
    entity_id: id,
    action: "contract_regenerated",
    metadata: { scope: facts.scopeKey, version: nextVersion },
  });
  revalidatePath(`/admin/contracts/${id}`);
  return { ok: true };
}

// ---- Admin: email a signed-contract copy (view link) to the client ---------
// 서명 완료 계약서 사본을 계약자 이메일로 발송. 1차는 PDF 첨부 없이 로그인
// 필요한 고객 계약 상세(/me/contracts/[id]) 링크를 전달한다. 발송 결과는
// notification_deliveries(channel=email, event_type=contract_copy_sent) +
// activity_logs(contract_copy_email_sent|failed)에 기록된다.
export async function sendContractCopyEmailAction(
  contractId: string,
): Promise<Result<{ sentAt: string }>> {
  await requireStaff();
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("contracts")
    .select("*, client:client_id(email, name, company_name)")
    .eq("id", contractId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return { ok: false, error: "계약서를 찾을 수 없습니다" };

  const contract = data as Contract;
  const client = (
    data as {
      client: {
        email: string | null;
        name: string | null;
        company_name: string | null;
      } | null;
    }
  ).client;

  // 서명 완료 계약서만 발송 가능 (고객 서명 또는 서명일 존재)
  const signed =
    Boolean(contract.client_signature) ||
    Boolean(contract.signed_at) ||
    contract.status === "signed";
  if (!signed) {
    return { ok: false, error: "서명이 완료된 계약서만 발송할 수 있습니다" };
  }

  const recipient = (client?.email ?? "").trim();
  const name = client?.name ?? client?.company_name ?? "고객";
  const signedAt = contract.signed_at
    ? String(contract.signed_at).slice(0, 10)
    : null;
  const contractUrl = `${siteUrl}/me/contracts/${contract.id}`;

  const res = await sendAuditedEmail({
    to: recipient || null,
    template: "contract_copy",
    data: {
      name,
      contractTitle: contract.title,
      contractNumber: contract.contract_number,
      amount: contract.amount,
      signedAt,
      contractUrl,
    },
    eventType: "contract_copy_sent",
    userId: contract.client_id,
    party: "client",
    metadata: { contract_id: contract.id },
  });

  await logActivity({
    entity_type: "contract",
    entity_id: contract.id,
    action: res.ok ? "contract_copy_email_sent" : "contract_copy_email_failed",
    metadata: { recipient: recipient || null, error: res.ok ? undefined : res.error },
  });

  if (!res.ok) {
    const msg = !recipient
      ? "계약자 이메일이 없어 발송할 수 없습니다"
      : res.error === "RESEND_API_KEY missing"
        ? "메일 발송 키(RESEND_API_KEY)가 설정되어 있지 않습니다"
        : res.error ?? "메일 발송에 실패했습니다";
    return { ok: false, error: msg };
  }

  revalidatePath(`/admin/contracts/${contract.id}`);
  return { ok: true, sentAt: new Date().toISOString() };
}
