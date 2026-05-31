import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Notification } from "@/lib/types/db";

export async function listMyNotifications(
  userId: string,
  limit = 30,
): Promise<Notification[]> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Notification[];
}

export async function unreadCount(userId: string): Promise<number> {
  const admin = createAdminSupabase();
  const { count } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

/** Header dropdown payload: latest few + unread count in one round trip. */
export async function notificationSummary(
  userId: string,
  limit = 5,
): Promise<{ items: Notification[]; unread: number }> {
  const [items, unread] = await Promise.all([
    listMyNotifications(userId, limit),
    unreadCount(userId),
  ]);
  return { items, unread };
}

/** Latest unread, actionable notifications for the main-page progress banner. */
export async function actionableNotifications(
  userId: string,
  limit = 4,
): Promise<Notification[]> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = (data ?? []) as Notification[];
  // Filtered by the registry's `actionable` flag in the caller to avoid a
  // circular import here; return the recent unread set.
  return rows.slice(0, limit * 3);
}
