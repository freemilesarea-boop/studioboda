import { createAdminSupabase } from "@/lib/supabase/admin";

export type NotificationType =
  | "welcome"
  | "quote_received"
  | "quote_expiring_soon"
  | "quote_expired"
  | "payment_requested"
  | "payment_paid"
  | "payment_failed"
  | "payment_reminder"
  | "project_started"
  | "project_delivered"
  | "project_completed"
  | "project_due_soon"
  | "file_uploaded"
  | "revision_requested"
  | "comment_posted"
  | "subscription_registration_requested"
  | "subscription_activated"
  | "subscription_charged"
  | "subscription_charge_failed"
  | "subscription_canceled"
  | "tax_document_requested"
  | "tax_document_issued";

export async function createNotification(
  userId: string | null | undefined,
  type: NotificationType,
  payload: Record<string, unknown> = {},
) {
  if (!userId) return;
  const admin = createAdminSupabase();
  await admin.from("notifications").insert({ user_id: userId, type, payload });
}

// Fan out to all staff (admin + manager + designer). Use for events that
// require operator attention (e.g. revision_requested, payment_paid).
export async function notifyStaff(
  type: NotificationType,
  payload: Record<string, unknown> = {},
) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["admin", "manager", "designer"]);
  if (!data?.length) return;
  await admin.from("notifications").insert(
    data.map((p) => ({ user_id: p.id, type, payload })),
  );
}
