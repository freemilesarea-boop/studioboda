// ============================================================
// STUDIO BODA — Single source of truth for project creation
// ============================================================
// A project must exist for a quote once that quote is accepted (by admin OR by
// the customer) or once any payment against it has been confirmed. Previously
// only the admin "견적 accepted" path created a project, and it did NOT set
// user_id — so customer-self-accepted quotes never produced a project and the
// deposit-paid kickoff gate fell through with `no_project`.
//
// ensureProjectForQuote() is idempotent (one project per quote) and callable
// from any server context (server action, webhook, reconcile cron) — no auth
// inside; callers gate access. It always populates user_id so the project is
// visible in the customer's /me/projects.
// ============================================================

import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";

export type EnsureProjectResult =
  | { ok: true; projectId: string; created: boolean }
  | { ok: false; error: string };

// A project is guaranteed for these quote states.
const QUALIFYING_STATUS = new Set(["accepted"]);
const QUALIFYING_PAYMENT = new Set(["deposit_paid", "fully_paid"]);

export async function ensureProjectForQuote(
  quoteId: string,
  opts?: { actorId?: string | null; source?: string; force?: boolean },
): Promise<EnsureProjectResult> {
  const admin = createAdminSupabase();

  const { data: quote } = await admin
    .from("quotes")
    .select("id, status, payment_status, user_id, inquiry_id, title, service_type")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) return { ok: false, error: "quote_not_found" };

  // Idempotency: a project already linked to this quote wins. This is the
  // primary dedup guard (low-concurrency ops); a partial unique index on
  // projects.quote_id (migration 0013) backstops any race.
  const { data: existing } = await admin
    .from("projects")
    .select("id")
    .eq("quote_id", quoteId)
    .maybeSingle();
  if (existing?.id) {
    return { ok: true, projectId: existing.id as string, created: false };
  }

  const qualifies =
    opts?.force === true ||
    QUALIFYING_STATUS.has(quote.status as string) ||
    QUALIFYING_PAYMENT.has((quote.payment_status as string) ?? "");
  if (!qualifies) return { ok: false, error: "not_qualified" };

  // Resolve the owner + display name. Prefer the quote's user_id; fall back to
  // the originating inquiry's user_id / contact name.
  let userId = (quote.user_id as string | null) ?? null;
  let clientName = "";
  let company: string | null = null;
  if (quote.inquiry_id) {
    const { data: inq } = await admin
      .from("inquiries")
      .select("name, company, user_id")
      .eq("id", quote.inquiry_id)
      .maybeSingle();
    clientName = (inq?.name as string) ?? "";
    company = (inq?.company as string | null) ?? null;
    if (!userId) userId = (inq?.user_id as string | null) ?? null;
  }

  const { data: created, error: insErr } = await admin
    .from("projects")
    .insert({
      quote_id: quoteId,
      inquiry_id: quote.inquiry_id,
      user_id: userId,
      client_name: clientName || (quote.title as string),
      company,
      title: quote.title,
      service_type: quote.service_type,
      status: "queued",
      priority: "normal",
      progress: 0,
    })
    .select("id")
    .single();

  if (insErr || !created) {
    // Lost a race (or a unique-violation): re-read and return the winner.
    const { data: again } = await admin
      .from("projects")
      .select("id")
      .eq("quote_id", quoteId)
      .maybeSingle();
    if (again?.id) return { ok: true, projectId: again.id as string, created: false };
    return { ok: false, error: insErr?.message ?? "insert_failed" };
  }

  await logActivity({
    actor_id: opts?.actorId ?? null,
    entity_type: "project",
    entity_id: created.id as string,
    action: "project_auto_created",
    metadata: {
      from_quote: quoteId,
      source: opts?.source ?? "ensure",
      quote_status: quote.status,
      payment_status: quote.payment_status,
    },
  });

  return { ok: true, projectId: created.id as string, created: true };
}
