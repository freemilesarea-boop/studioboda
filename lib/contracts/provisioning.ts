// ============================================================
// STUDIO BODA — Contract provisioning (system context, no auth)
// ============================================================
// Canonical create/send logic shared by:
//   • the admin server actions (lib/actions/contracts.ts)
//   • the PayApp webhook (app/api/payapp/webhook/route.ts) — system context,
//     no staff session, so these plain async functions must NOT call requireStaff.
// All functions are best-effort and log failures to activity_logs.
// ============================================================

import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { sendTemplate } from "@/lib/email/send";
import { logCrmActivity } from "@/lib/actions/crm";
import { getEffectiveClauseBlocks } from "@/lib/queries/contract-clauses";
import { siteUrl } from "@/lib/company";
import { DEFAULT_DEPOSIT_RATE } from "@/lib/payments/constants";
import { composeContract, type ContractComposeFacts } from "./engine";
import {
  contractTitleFor,
  defaultRevisionCount,
  recommendTemplate,
  type ContractTemplateKind,
} from "./templates";
import type { Contract, QuoteOption } from "@/lib/types/db";

export type QuoteRow = {
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
  options?: unknown;
};

// Derive engine facts (incl. 견적항목/산출물) from a quote + resolved customer.
export function composeFactsFromQuote(
  quote: QuoteRow,
  customerName: string,
  kind: ContractTemplateKind,
): ContractComposeFacts {
  const amount = quote.total_price ?? 0;
  const depositRate = quote.deposit_rate ?? DEFAULT_DEPOSIT_RATE;
  const depositAmount =
    quote.deposit_amount ?? Math.round((amount * depositRate) / 100);
  const balanceAmount = quote.balance_amount ?? amount - depositAmount;
  const options = Array.isArray(quote.options)
    ? (quote.options as QuoteOption[])
    : [];
  const deliverables = options
    .map((o) => o?.label)
    .filter((l): l is string => typeof l === "string" && l.length > 0);
  return {
    kind,
    customerName,
    projectTitle: quote.title,
    serviceType: quote.service_type,
    amount,
    depositRate,
    depositAmount,
    balanceAmount,
    monthlyAmount: amount,
    deliveryDays: quote.delivery_days,
    revisionCount: defaultRevisionCount(kind),
    deliverables,
    recurring: kind === "maintenance",
  };
}

// Compose the full contract body from the effective clause registry.
export async function composeBody(facts: ContractComposeFacts): Promise<string> {
  const blocks = await getEffectiveClauseBlocks();
  return composeContract(blocks, facts).body;
}

type EnsureResult =
  | { ok: true; contractId: string; created: boolean; status: string }
  | { ok: false; error: string };

/**
 * Ensure a contract exists for the quote. Idempotent: returns the existing
 * (non-deleted) contract if one already exists, otherwise creates a draft +
 * version 1 from the recommended template. Safe to call from system context.
 */
export async function ensureContractForQuote(
  quoteId: string,
  opts?: { actorId?: string | null },
): Promise<EnsureResult> {
  const admin = createAdminSupabase();

  const { data: quote } = await admin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) return { ok: false, error: "견적을 찾을 수 없습니다" };

  // Idempotency — reuse the latest non-deleted contract for this quote.
  const { data: existing } = await admin
    .from("contracts")
    .select("id, status")
    .eq("quote_id", quoteId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) {
    return {
      ok: true,
      contractId: existing.id as string,
      created: false,
      status: existing.status as string,
    };
  }

  // Resolve client + display name
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

  const kind = recommendTemplate({
    serviceType: quote.service_type as string | null,
    title: quote.title as string,
  });
  const facts = composeFactsFromQuote(quote as QuoteRow, customerName, kind);
  const title = contractTitleFor(kind, quote.title as string);
  const body = await composeBody(facts);
  const amount = (quote.total_price as number) ?? 0;

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
      created_by: opts?.actorId ?? null,
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
    created_by: opts?.actorId ?? null,
  });

  await logActivity({
    actor_id: opts?.actorId ?? null,
    entity_type: "contract",
    entity_id: inserted.id,
    action: "contract_created",
    metadata: {
      quote_id: quoteId,
      contract_number: inserted.contract_number,
      auto: opts?.actorId ? false : true,
    },
  });
  if (quote.inquiry_id) {
    void logCrmActivity({
      inquiryId: quote.inquiry_id as string,
      actorId: opts?.actorId ?? null,
      type: "contract",
      body: `계약서 생성 (${inserted.contract_number})`,
    });
  }

  return { ok: true, contractId: inserted.id as string, created: true, status: "draft" };
}

/**
 * Email the contract review/sign link to the client. Logs failures to
 * activity_logs (and pings staff) so a missing/failed email is visible.
 */
export async function emailContractToClient(contract: {
  id: string;
  title: string;
  amount: number;
  client_id: string | null;
  contract_number?: string | null;
}): Promise<boolean> {
  if (!contract.client_id) return false;
  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, name, company_name")
    .eq("id", contract.client_id)
    .maybeSingle();
  const recipient = profile?.email ?? null;
  if (!recipient) {
    await logActivity({
      entity_type: "contract",
      entity_id: contract.id,
      action: "contract_email_skipped_no_recipient",
    });
    return false;
  }
  const name = profile?.name ?? profile?.company_name ?? "고객";
  const res = await sendTemplate(recipient, "contract_sent", {
    name,
    contractTitle: contract.title,
    amount: contract.amount,
    contractUrl: `${siteUrl}/me/contracts/${contract.id}`,
  });
  if (!res.ok) {
    await logActivity({
      entity_type: "contract",
      entity_id: contract.id,
      action: "contract_email_failed",
      metadata: { error: res.error ?? "unknown", recipient },
    });
    void notifyStaff("contract_sent", {
      contract_id: contract.id,
      email_failed: true,
      reason: res.error,
    });
    return false;
  }
  await logActivity({
    entity_type: "contract",
    entity_id: contract.id,
    action: "contract_email_sent",
    metadata: { recipient },
  });
  return true;
}

/**
 * Send a draft contract to the client (status → sent) + notification + email.
 * Idempotent: a contract that is not in `draft` is left untouched.
 */
export async function sendContractIfDraft(
  contractId: string,
  opts?: { actorId?: string | null },
): Promise<{ ok: boolean; sent: boolean; error?: string }> {
  const admin = createAdminSupabase();
  const { data: c } = await admin
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .maybeSingle();
  if (!c) return { ok: false, sent: false, error: "계약서를 찾을 수 없습니다" };
  const contract = c as Contract;

  if (!contract.client_id) {
    await logActivity({
      actor_id: opts?.actorId ?? null,
      entity_type: "contract",
      entity_id: contractId,
      action: "contract_send_skipped_no_client",
    });
    return { ok: false, sent: false, error: "연결된 고객 계정이 없습니다" };
  }
  if (contract.status !== "draft") {
    // already sent/viewed/signed — do not resend
    return { ok: true, sent: false };
  }

  await admin
    .from("contracts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", contractId);

  await logActivity({
    actor_id: opts?.actorId ?? null,
    entity_type: "contract",
    entity_id: contractId,
    action: "contract_sent",
    metadata: { auto: opts?.actorId ? false : true },
  });
  void createNotification(contract.client_id, "contract_sent", {
    contract_id: contractId,
    contract_number: contract.contract_number,
    title: contract.title,
  });
  void notifyStaff("contract_sent", {
    contract_id: contractId,
    contract_number: contract.contract_number,
  });

  await emailContractToClient({
    id: contract.id,
    title: contract.title,
    amount: contract.amount,
    client_id: contract.client_id,
    contract_number: contract.contract_number,
  });

  return { ok: true, sent: true };
}

/**
 * Full auto-flow triggered by a successful 예약금(deposit) payment:
 * ensure a contract exists for the quote, then send it if still a draft.
 * Best-effort; logs and swallows errors so the webhook always acks.
 */
export async function provisionContractForPaidDeposit(
  quoteId: string,
): Promise<void> {
  const ensured = await ensureContractForQuote(quoteId);
  if (!ensured.ok) {
    await logActivity({
      entity_type: "contract",
      entity_id: null,
      action: "contract_autoprovision_failed",
      metadata: { quote_id: quoteId, error: ensured.error },
    });
    return;
  }
  await sendContractIfDraft(ensured.contractId);
}
