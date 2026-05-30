"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff, getProfile } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { logCrmActivity, setLeadStatusForInquiry } from "@/lib/actions/crm";
import type { Contract } from "@/lib/types/db";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

// Default contract body composed from quote/customer facts. Stored as a
// snapshot on the contract so later quote edits never mutate a signed contract.
function defaultContractBody(input: {
  customerName: string;
  title: string;
  amount: number;
  deliveryDays: number | null;
}): string {
  return [
    `본 계약은 STUDIO BODA(이하 "회사")와 ${input.customerName}(이하 "고객") 간에`,
    `다음 프로젝트의 제작 용역에 관하여 체결합니다.`,
    ``,
    `1. 프로젝트: ${input.title}`,
    `2. 계약 금액: ${fmt(input.amount)}원 (VAT 별도)`,
    input.deliveryDays ? `3. 납기: 착수일로부터 ${input.deliveryDays}영업일` : `3. 납기: 별도 협의`,
    `4. 대금 지급: 예약금 입금일을 착수일로 하며, 잔금은 최종 검수 후 지급합니다.`,
    `5. 수정 횟수: 패키지별 기본 디렉팅 수정이 포함되며, 초과분은 별도 비용이 발생합니다.`,
    `6. 저작권: 최종 산출물의 저작재산권은 잔금 완납 시 고객에게 양도됩니다.`,
    `7. 비밀유지: 양 당사자는 업무상 알게 된 정보를 제3자에게 누설하지 않습니다.`,
    `8. 기타: 본 계약에 정하지 않은 사항은 회사 이용약관 및 관계 법령을 따릅니다.`,
  ].join("\n");
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
  const title = `[계약] ${quote.title}`;
  const body = defaultContractBody({
    customerName,
    title: quote.title as string,
    amount,
    deliveryDays: (quote.delivery_days as number) ?? null,
  });

  const { data: inserted, error } = await admin
    .from("contracts")
    .insert({
      quote_id: quoteId,
      client_id: clientId,
      title,
      body,
      amount,
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
    snapshot: { quote_id: quoteId, source: "quote" },
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
