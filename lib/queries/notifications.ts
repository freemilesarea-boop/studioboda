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
