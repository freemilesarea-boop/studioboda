"use server";

// ============================================================
// STUDIO BODA — Repair: quote.payment_status ↔ ledger consistency
// ============================================================
// Backfill helper for historical quotes whose cached payment_status drifted
// from the actual payments ledger (e.g. a paid→failed transition that never
// reversed the cache). Preview is read-only; repair runs the idempotent,
// audited syncQuotePaymentState. Nothing is deleted; amounts/paid_at untouched.
// ============================================================

import { requireStaff } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  calculateQuotePaymentStatusFromPayments,
  syncQuotePaymentState,
} from "@/lib/payments/status";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export type PaymentMismatch = {
  quote_id: string;
  title: string;
  cached_status: string | null;
  ledger_status: string;
  project_id: string | null;
  project_billing: string | null;
};

/** Read-only: quotes whose cached payment_status ≠ ledger truth. */
export async function findPaymentStateMismatchesAction(): Promise<
  { ok: true; mismatches: PaymentMismatch[] } | { ok: false; error: string }
> {
  await requireStaff();
  const admin = createAdminSupabase();
  const { data: quotes, error } = await admin
    .from("quotes")
    .select("id, title, payment_status")
    .is("deleted_at", null);
  if (error) return { ok: false, error: error.message };

  const out: PaymentMismatch[] = [];
  for (const q of (quotes ?? []) as Array<{
    id: string;
    title: string;
    payment_status: string | null;
  }>) {
    const ledger = await calculateQuotePaymentStatusFromPayments(q.id, admin);
    if ((q.payment_status ?? "unpaid") === ledger) continue;
    const { data: proj } = await admin
      .from("projects")
      .select("id, billing_status")
      .eq("quote_id", q.id)
      .maybeSingle();
    out.push({
      quote_id: q.id,
      title: q.title,
      cached_status: q.payment_status,
      ledger_status: ledger,
      project_id: (proj?.id as string | null) ?? null,
      project_billing: (proj?.billing_status as string | null) ?? null,
    });
  }
  return { ok: true, mismatches: out };
}

/** Staff: reconcile every mismatched quote to the ledger (idempotent, audited). */
export async function repairPaymentStateAction(): Promise<
  | { ok: true; repaired: number; details: Array<{ quote_id: string; from: string | null; to: string; reversed: boolean }> }
  | { ok: false; error: string }
> {
  const me = await requireStaff();
  const found = await findPaymentStateMismatchesAction();
  if (!found.ok) return found;

  const details: Array<{ quote_id: string; from: string | null; to: string; reversed: boolean }> = [];
  for (const m of found.mismatches) {
    const r = await syncQuotePaymentState(m.quote_id, {
      actorId: me.id,
      source: "admin_repair",
    });
    if (r.changed) {
      details.push({ quote_id: m.quote_id, from: r.from, to: r.to, reversed: r.reversed });
    }
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "system",
    entity_id: null,
    action: "payment_state_repair_batch",
    metadata: { repaired: details.length },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/projects");
  return { ok: true, repaired: details.length, details };
}
