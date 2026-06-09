"use server";

// ============================================================
// STUDIO BODA — One-off repair: backfill missing projects
// ============================================================
// Historical quotes that were accepted (or paid) before ensureProjectForQuote
// existed have no project row. These actions let a staff member (a) preview the
// affected quotes (read-only) and (b) create the missing projects idempotently.
// Nothing is deleted; ensureProjectForQuote skips quotes that already have a
// project. Run the preview first, then the repair.
// ============================================================

import { requireStaff } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { ensureProjectForQuote } from "@/lib/projects/ensure";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

type MissingQuote = {
  id: string;
  title: string;
  status: string;
  payment_status: string | null;
  user_id: string | null;
};

/** Read-only: quotes that qualify for a project but have none yet. */
export async function findQuotesMissingProjectAction(): Promise<
  { ok: true; quotes: MissingQuote[] } | { ok: false; error: string }
> {
  await requireStaff();
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("quotes")
    .select("id, title, status, payment_status, user_id")
    .or("status.eq.accepted,payment_status.in.(deposit_paid,fully_paid)");
  if (error) return { ok: false, error: error.message };

  const candidates = (data ?? []) as MissingQuote[];
  const missing: MissingQuote[] = [];
  for (const q of candidates) {
    const { data: proj } = await admin
      .from("projects")
      .select("id")
      .eq("quote_id", q.id)
      .maybeSingle();
    if (!proj) missing.push(q);
  }
  return { ok: true, quotes: missing };
}

/** Create the missing projects (idempotent). Staff-only. */
export async function repairMissingProjectsAction(): Promise<
  | {
      ok: true;
      createdCount: number;
      created: Array<{ quoteId: string; projectId: string }>;
    }
  | { ok: false; error: string }
> {
  const me = await requireStaff();
  const found = await findQuotesMissingProjectAction();
  if (!found.ok) return found;

  const created: Array<{ quoteId: string; projectId: string }> = [];
  for (const q of found.quotes) {
    const r = await ensureProjectForQuote(q.id, {
      actorId: me.id,
      source: "repair_backfill",
      force: true,
    });
    if (r.ok && r.created) created.push({ quoteId: q.id, projectId: r.projectId });
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: null,
    action: "projects_backfill_repair",
    metadata: { created_count: created.length },
  });

  revalidatePath("/admin/projects");
  return { ok: true, createdCount: created.length, created };
}
