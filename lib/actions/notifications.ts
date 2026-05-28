"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";

export async function markAllNotificationsReadAction() {
  const me = await getProfile();
  if (!me) return { ok: false as const, error: "로그인이 필요합니다" };
  const admin = createAdminSupabase();
  await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", me.id)
    .is("read_at", null);
  revalidatePath("/me");
  revalidatePath("/me/notifications");
  return { ok: true as const };
}

export async function markNotificationReadAction(id: string) {
  const me = await getProfile();
  if (!me) return { ok: false as const, error: "로그인이 필요합니다" };
  const admin = createAdminSupabase();
  await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", me.id);
  revalidatePath("/me");
  revalidatePath("/me/notifications");
  return { ok: true as const };
}
