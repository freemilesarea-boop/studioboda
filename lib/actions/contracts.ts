"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff, getProfile } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { logCrmActivity, setLeadStatusForInquiry } from "@/lib/actions/crm";
import {
  CONTRACT_TEMPLATE_KINDS,
  contractTitleFor,
  defaultRevisionCount,
  recommendTemplate,
  renderContractBody,
  type ContractFacts,
  type ContractTemplateKind,
} from "@/lib/contracts/templates";
import type { Contract } from "@/lib/types/db";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

type QuoteRow = {
  id: string;
  title: string;
  service_type: string | null;
  total_price: number | null;
  deposit_rate: number | null;
  deposit_amount: number | null;
  balance_amount: number | null;
  delivery_days: number | null;
  user_id: string | null;
  inquiry_id: string | null;
};

// Derive the fill-in facts a template needs from a quote + resolved customer.
function factsFromQuote(
  quote: QuoteRow,
  customerName: string,
  kind: ContractTemplateKind,
): ContractFacts {
  const amount = quote.total_price ?? 0;
  const depositRate = quote.deposit_rate ?? 10;
  const depositAmount =
    quote.deposit_amount ?? Math.round((amount * depositRate) / 100);
  const balanceAmount = quote.balance_amount ?? amount - depositAmount;
  return {
    customerName,
    projectTitle: quote.title,
    serviceType: quote.service_type,
    amount,
    depositRate,
    depositAmount,
    balanceAmount,
    deliveryDays: quote.delivery_days,
    revisionCount: defaultRevisionCount(kind),
    monthlyAmount: amount,
  };
}

// ---- Admin: generate a contract from an (accepted) quote ----
export async function createContractFromQuoteAction(
  quoteId: string,
): Promise<Result<{ contract_id: string }>> {
  const me = await requireStaff();
  const admin = createAdminSupabase();

  const { data: quote } = await admin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) return { ok: false, error: "견적을 찾을 수 없습니다" };

  // Resolve client + name
  let clientId = (quote.user_id as string | null) ?? null;
  let customerName = "고객";
  if (clientId) {
    const { data: p } = await admin
      .from("profiles")
      .select("name, company_name")
      .eq("id", clientId)
      .maybeSingle();
    customerName = p?.company_name || p?.name || customerName;
  } else if (quote.inquiry_id) {
    const { data: inq } = await admin
      .from("inquiries")
      .select("name, company, user_id")
      .eq("id", quote.inquiry_id)
      .maybeSingle();
    if (inq?.user_id) clientId = inq.user_id;
    customerName = inq?.company || inq?.name || customerName;
  }

  const amount = (quote.total_price as number) ?? 0;
  // Recommend a template from the quote's service/category/title.
  const kind = recommendTemplate({
    serviceType: quote.service_type as string | null,
    title: quote.title as string,
  });
  const facts = factsFromQuote(quote as QuoteRow, customerName, kind);
  const title = contractTitleFor(kind, quote.title as string);
  const body = renderContractBody(kind, facts);

  const { data: inserted, error } = await admin
    .from("contracts")
    .insert({
      quote_id: quoteId,
      client_id: clientId,
      title,
      body,
      amount,
      template_kind: kind,
      status: "draft",
      created_by: me.id,
      current_version: 1,
    })
    .select("id, contract_number")
    .single();
  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "계약서 생성 실패" };
  }

  await admin.from("contract_versions").insert({
    contract_id: inserted.id,
    version: 1,
    title,
    body,
    amount,
    snapshot: { quote_id: quoteId, source: "quote", template_kind: kind },
    created_by: me.id,
  });

  await logActivity({
    actor_id: me.id,
    entity_type: "contract",
    entity_id: inserted.id,
    action: "contract_created",
    metadata: { quote_id: quoteId, contract_number: inserted.contract_number },
  });
  if (quote.inquiry_id) {
    void logCrmActivity({
      inquiryId: quote.inquiry_id as string,
      actorId: me.id,
      type: "contract",
      body: `계약서 생성 (${inserted.contract_number})`,
    });
  }

  revalidatePath("/admin/contracts");
  return { ok: true, contract_id: inserted.id };
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

// ---- Admin: send to customer ----
export async function sendContractAction(id: string): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: c } = await admin.from("contracts").select("*").eq("id", id).maybeSingle();
  if (!c) return { ok: false, error: "계약서를 찾을 수 없습니다" };
  const contract = c as Contract;
  if (!contract.client_id) {
    return { ok: false, error: "계약서에 연결된 고객 계정이 없습니다" };
  }
  if (contract.status === "signed") return { ok: false, error: "이미 완료된 계약입니다" };

  await admin
    .from("contracts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);

  await logActivity({
    actor_id: me.id,
    entity_type: "contract",
    entity_id: id,
    action: "contract_sent",
  });
  void createNotification(contract.client_id, "contract_sent", {
    contract_id: id,
    contract_number: contract.contract_number,
    title: contract.title,
  });

  revalidatePath(`/admin/contracts/${id}`);
  revalidatePath("/me/contracts");
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
  }

  revalidatePath("/me/contracts");
  revalidatePath(`/me/contracts/${id}`);
  return { ok: true };
}

// ---- Admin: change the contract template type → regenerates body (new version) ----
export async function changeContractTemplateAction(
  id: string,
  kind: ContractTemplateKind,
): Promise<Result> {
  const me = await requireStaff();
  if (!CONTRACT_TEMPLATE_KINDS.includes(kind)) {
    return { ok: false, error: "올바르지 않은 계약서 유형입니다" };
  }
  const admin = createAdminSupabase();
  const { data: c } = await admin.from("contracts").select("*").eq("id", id).maybeSingle();
  if (!c) return { ok: false, error: "계약서를 찾을 수 없습니다" };
  const contract = c as Contract;
  if (contract.status === "signed") {
    return { ok: false, error: "이미 서명 완료된 계약은 변경할 수 없습니다" };
  }

  // Resolve customer name
  let customerName = "고객";
  if (contract.client_id) {
    const { data: p } = await admin
      .from("profiles")
      .select("name, company_name")
      .eq("id", contract.client_id)
      .maybeSingle();
    customerName = p?.company_name || p?.name || customerName;
  }

  // Strip the existing "[유형] " prefix to recover the project title.
  let projectTitle = contract.title.replace(/^\[[^\]]*\]\s*/, "");
  let facts: ContractFacts | null = null;
  if (contract.quote_id) {
    const { data: q } = await admin
      .from("quotes")
      .select(
        "id,title,service_type,total_price,deposit_rate,deposit_amount,balance_amount,delivery_days,user_id,inquiry_id",
      )
      .eq("id", contract.quote_id)
      .maybeSingle();
    if (q) {
      facts = factsFromQuote(q as QuoteRow, customerName, kind);
      projectTitle = q.title as string;
    }
  }
  if (!facts) {
    // No linked quote — derive minimal facts from the stored amount.
    const amount = contract.amount;
    const depositRate = 10;
    const depositAmount = Math.round((amount * depositRate) / 100);
    facts = {
      customerName,
      projectTitle,
      serviceType: null,
      amount,
      depositRate,
      depositAmount,
      balanceAmount: amount - depositAmount,
      deliveryDays: null,
      revisionCount: defaultRevisionCount(kind),
      monthlyAmount: amount,
    };
  }

  const title = contractTitleFor(kind, projectTitle);
  const body = renderContractBody(kind, facts);
  const nextVersion = contract.current_version + 1;

  const { error } = await admin
    .from("contracts")
    .update({ template_kind: kind, title, body, current_version: nextVersion })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await admin.from("contract_versions").insert({
    contract_id: id,
    version: nextVersion,
    title,
    body,
    amount: contract.amount,
    snapshot: { template_kind: kind, changed_by: me.id, source: "template_change" },
    created_by: me.id,
  });

  await logActivity({
    actor_id: me.id,
    entity_type: "contract",
    entity_id: id,
    action: "contract_template_changed",
    metadata: { template_kind: kind, version: nextVersion },
  });
  revalidatePath(`/admin/contracts/${id}`);
  return { ok: true };
}
