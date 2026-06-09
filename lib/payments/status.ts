// ============================================================
// STUDIO BODA — Payment ledger truth (single source)
// ============================================================
// quotes.payment_status is a *cached summary*. The authoritative value is the
// payments ledger: only status='paid' rows count — failed/cancelled/refunded/
// pending never count as paid.
//
//   deposit paid + balance paid → fully_paid
//   deposit paid only           → deposit_paid
//   otherwise                   → unpaid
//
// Reusable by webhook / reconcile / admin repair / display so every surface
// agrees on one definition.
// ============================================================

import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { notifyStaff } from "@/lib/notifications";

export type QuotePaymentStatus = "unpaid" | "deposit_paid" | "fully_paid";

type Admin = ReturnType<typeof createAdminSupabase>;
type PayRow = { type: string; status: string };

/** Pure: derive ledger status from already-fetched payment rows (for UI reuse). */
export function ledgerStatusFromRows(rows: PayRow[]): QuotePaymentStatus {
  const paid = (t: string) => rows.some((r) => r.type === t && r.status === "paid");
  if (paid("deposit") && paid("balance")) return "fully_paid";
  if (paid("deposit")) return "deposit_paid";
  return "unpaid";
}

/** Ledger-truth payment status for a quote, computed from the payments table. */
export async function calculateQuotePaymentStatusFromPayments(
  quoteId: string,
  admin?: Admin,
): Promise<QuotePaymentStatus> {
  const db = admin ?? createAdminSupabase();
  const { data } = await db
    .from("payments")
    .select("type,status")
    .eq("quote_id", quoteId);
  return ledgerStatusFromRows((data ?? []) as PayRow[]);
}

const RANK: Record<QuotePaymentStatus, number> = {
  unpaid: 0,
  deposit_paid: 1,
  fully_paid: 2,
};

export type SyncResult = {
  changed: boolean;
  from: string | null;
  to: QuotePaymentStatus;
  reversed: boolean;
};

/**
 * Reconcile quote.payment_status (always) + project.billing_status (only on a
 * downward regression, or fully_paid→completed) to the actual ledger.
 * Idempotent. On a regression (paid→lower) it logs payment_state_reversed and
 * alerts staff — but never cancels the project or touches inquiry/contract.
 *
 * Forward billing transitions (e.g. deposit_paid→in_progress) are intentionally
 * left to the kickoff gate (contract-signed + deposit-paid), so this function
 * does not force in_progress on deposit alone.
 */
export async function syncQuotePaymentState(
  quoteId: string,
  opts?: { actorId?: string | null; source?: string },
): Promise<SyncResult> {
  const admin = createAdminSupabase();
  const { data: quote } = await admin
    .from("quotes")
    .select("id, payment_status")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) {
    return { changed: false, from: null, to: "unpaid", reversed: false };
  }

  const ledger = await calculateQuotePaymentStatusFromPayments(quoteId, admin);
  const prev = (quote.payment_status as string | null) ?? null;
  const prevRank = prev && prev in RANK ? RANK[prev as QuotePaymentStatus] : 0;
  const reversed = RANK[ledger] < prevRank;
  const changed = prev !== ledger;

  if (changed) {
    await admin
      .from("quotes")
      .update({ payment_status: ledger })
      .eq("id", quoteId);
    await logActivity({
      actor_id: opts?.actorId ?? null,
      entity_type: "quote",
      entity_id: quoteId,
      action: reversed ? "payment_state_reversed" : "payment_state_synced",
      metadata: { from: prev, to: ledger, source: opts?.source ?? "sync" },
    });
  }

  // Project billing: only correct regressions + the safe fully_paid→completed.
  const { data: project } = await admin
    .from("projects")
    .select("id, status, billing_status")
    .eq("quote_id", quoteId)
    .maybeSingle();
  if (project) {
    let nextBilling: string | null = null;
    if (ledger === "unpaid" && project.billing_status !== "waiting_deposit") {
      // Deposit no longer paid → roll billing back (do NOT cancel the project).
      nextBilling = "waiting_deposit";
    } else if (ledger === "deposit_paid" && project.billing_status === "completed") {
      // Balance was reversed → drop from completed.
      nextBilling = project.status === "delivered" ? "waiting_balance" : "in_progress";
    } else if (ledger === "fully_paid" && project.billing_status !== "completed") {
      nextBilling = "completed";
    }
    if (nextBilling && nextBilling !== project.billing_status) {
      await admin
        .from("projects")
        .update({ billing_status: nextBilling })
        .eq("id", project.id);
      await logActivity({
        actor_id: opts?.actorId ?? null,
        entity_type: "project",
        entity_id: project.id as string,
        action: "billing_status_synced",
        metadata: {
          from: project.billing_status,
          to: nextBilling,
          ledger,
          source: opts?.source ?? "sync",
        },
      });
    }
  }

  if (reversed) {
    // Staff alert — reuse the registered payment_failed meta (has a fallback).
    void notifyStaff("payment_failed", {
      quote_id: quoteId,
      reversed: true,
      from: prev,
      to: ledger,
      note: "결제 상태가 원장 기준으로 하향 보정되었습니다 (취소/실패/환불).",
    });
  }

  return { changed, from: prev, to: ledger, reversed };
}
