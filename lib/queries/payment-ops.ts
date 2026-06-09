// ============================================================
// STUDIO BODA — Payment operations health (read-only)
// ============================================================
// One read-only snapshot powering the admin "결제 운영 상태" widget. Aggregates
// webhook / reconcile activity, ledger mismatches, pending aging, stuck
// kickoffs, and email delivery failures. NEVER mutates state.
// ============================================================

import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { ledgerStatusFromRows } from "@/lib/payments/status";

export type PaymentMismatchRow = {
  quote_id: string;
  title: string;
  cached: string | null;
  ledger: string;
};
export type PendingAgingRow = {
  id: string;
  title: string;
  amount: number;
  created_at: string;
  has_mul_no: boolean;
};
export type KickoffStuckRow = {
  project_no: string;
  project_id: string;
  quote_id: string;
};
export type EmailErrorRow = {
  event_type: string;
  to_address: string | null;
  error: string | null;
  created_at: string;
};

export type PaymentOpsHealth = {
  webhookPaid24h: number;
  webhookFailed24h: number;
  webhookUnknown24h: number;
  lastWebhookAt: string | null;
  lastReconcileAt: string | null;
  reconcileApplied24h: number;
  paymentMismatchCount: number;
  paymentMismatches: PaymentMismatchRow[];
  oldPendingPaymentsCount: number;
  oldPendingPayments: PendingAgingRow[];
  kickoffStuckCount: number;
  kickoffStuckProjects: KickoffStuckRow[];
  emailFailed24h: number;
  latestEmailErrors: EmailErrorRow[];
};

export async function getPaymentOpsHealth(): Promise<PaymentOpsHealth> {
  await requireStaff();
  const admin = createAdminSupabase();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const in24 = (ts: string) => ts >= sinceIso;

  // ── webhook activity ──
  const { data: wh } = await admin
    .from("activity_logs")
    .select("action, created_at")
    .in("action", ["webhook_paid", "webhook_failed", "webhook_unknown", "webhook_cancelled"])
    .order("created_at", { ascending: false })
    .limit(500);
  const whRows = (wh ?? []) as Array<{ action: string; created_at: string }>;
  const countAct = (a: string) =>
    whRows.filter((r) => r.action === a && in24(r.created_at)).length;

  // ── reconcile (only logged when something was applied) ──
  const { data: rec } = await admin
    .from("activity_logs")
    .select("created_at")
    .eq("action", "cron_reconcile_applied")
    .order("created_at", { ascending: false })
    .limit(100);
  const recRows = (rec ?? []) as Array<{ created_at: string }>;

  // ── ledger mismatch (cache vs payments) ──
  const [{ data: quotes }, { data: pays }] = await Promise.all([
    admin.from("quotes").select("id, title, payment_status"),
    admin.from("payments").select("quote_id, type, status"),
  ]);
  const payByQuote = new Map<string, Array<{ type: string; status: string }>>();
  for (const p of (pays ?? []) as Array<{ quote_id: string | null; type: string; status: string }>) {
    if (!p.quote_id) continue;
    const arr = payByQuote.get(p.quote_id) ?? [];
    arr.push({ type: p.type, status: p.status });
    payByQuote.set(p.quote_id, arr);
  }
  const depositPaidQuotes = new Set<string>();
  for (const [qid, rows] of payByQuote) {
    if (rows.some((r) => r.type === "deposit" && r.status === "paid")) depositPaidQuotes.add(qid);
  }
  const paymentMismatches: PaymentMismatchRow[] = [];
  for (const q of (quotes ?? []) as Array<{ id: string; title: string; payment_status: string | null }>) {
    const ledger = ledgerStatusFromRows(payByQuote.get(q.id) ?? []);
    if ((q.payment_status ?? "unpaid") !== ledger) {
      paymentMismatches.push({ quote_id: q.id, title: q.title, cached: q.payment_status, ledger });
    }
  }

  // ── pending aging (>24h) ──
  const { data: pend } = await admin
    .from("payments")
    .select("id, title, amount, created_at, payapp_mul_no")
    .eq("status", "pending")
    .lt("created_at", sinceIso)
    .order("created_at", { ascending: true })
    .limit(50);
  const oldPendingPayments: PendingAgingRow[] = (
    (pend ?? []) as Array<{ id: string; title: string; amount: number; created_at: string; payapp_mul_no: string | null }>
  ).map((r) => ({
    id: r.id,
    title: r.title,
    amount: r.amount,
    created_at: r.created_at,
    has_mul_no: Boolean(r.payapp_mul_no),
  }));

  // ── kickoff stuck: queued projects with signed contract + paid deposit ──
  const { data: queued } = await admin
    .from("projects")
    .select("id, project_no, quote_id")
    .eq("status", "queued")
    .not("quote_id", "is", null)
    .limit(100);
  const queuedRows = (queued ?? []) as Array<{ id: string; project_no: string; quote_id: string }>;
  const queuedQuoteIds = queuedRows.map((p) => p.quote_id);
  let signedSet = new Set<string>();
  if (queuedQuoteIds.length) {
    const { data: signed } = await admin
      .from("contracts")
      .select("quote_id")
      .in("quote_id", queuedQuoteIds)
      .not("client_signature", "is", null)
      .is("deleted_at", null);
    signedSet = new Set(((signed ?? []) as Array<{ quote_id: string }>).map((c) => c.quote_id));
  }
  const kickoffStuckProjects: KickoffStuckRow[] = queuedRows
    .filter((p) => signedSet.has(p.quote_id) && depositPaidQuotes.has(p.quote_id))
    .map((p) => ({ project_no: p.project_no, project_id: p.id, quote_id: p.quote_id }));

  // ── email delivery failures (24h) ──
  const { data: ef } = await admin
    .from("notification_deliveries")
    .select("event_type, to_address, error, created_at")
    .eq("channel", "email")
    .eq("status", "failed")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(20);
  const efRows = (ef ?? []) as EmailErrorRow[];

  return {
    webhookPaid24h: countAct("webhook_paid"),
    webhookFailed24h: countAct("webhook_failed"),
    webhookUnknown24h: countAct("webhook_unknown"),
    lastWebhookAt: whRows[0]?.created_at ?? null,
    lastReconcileAt: recRows[0]?.created_at ?? null,
    reconcileApplied24h: recRows.filter((r) => in24(r.created_at)).length,
    paymentMismatchCount: paymentMismatches.length,
    paymentMismatches: paymentMismatches.slice(0, 20),
    oldPendingPaymentsCount: oldPendingPayments.length,
    oldPendingPayments: oldPendingPayments.slice(0, 10),
    kickoffStuckCount: kickoffStuckProjects.length,
    kickoffStuckProjects: kickoffStuckProjects.slice(0, 10),
    emailFailed24h: efRows.length,
    latestEmailErrors: efRows.slice(0, 5),
  };
}
