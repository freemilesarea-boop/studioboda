"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff, getProfile } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { notifyCustomer } from "@/lib/notifications/dispatch";

type Result = { ok: true } | { ok: false; error: string };

// ---- Admin: global channel on/off ----
export async function setNotificationChannelsAction(
  email: boolean,
  kakao: boolean,
): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("notification_settings")
    .upsert(
      { key: "channels", value: { email, kakao }, updated_by: me.id, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) return { ok: false, error: error.message };
  await logActivity({
    actor_id: me.id,
    entity_type: "notification",
    entity_id: null,
    action: "channels_updated",
    metadata: { email, kakao },
  });
  revalidatePath("/admin/notifications/settings");
  return { ok: true };
}

// ---- Admin: send a test notification to self ----
export async function sendTestNotificationAction(): Promise<Result> {
  const me = await requireStaff();
  await notifyCustomer({
    userId: me.id,
    type: "welcome",
    payload: { test: true },
  });
  await logActivity({
    actor_id: me.id,
    entity_type: "notification",
    entity_id: null,
    action: "test_sent",
  });
  return { ok: true };
}

// ---- Customer: consent toggles ----
export async function updateNotificationConsentAction(
  formData: FormData,
): Promise<Result> {
  const me = await getProfile();
  if (!me) return { ok: false, error: "로그인이 필요합니다" };
  const email = formData.get("email_opt_in") === "on";
  const kakao = formData.get("kakao_opt_in") === "on";
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("profiles")
    .update({ email_opt_in: email, kakao_opt_in: kakao })
    .eq("id", me.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    actor_id: me.id,
    entity_type: "profile",
    entity_id: me.id,
    action: "notification_consent_updated",
    metadata: { email, kakao },
  });
  revalidatePath("/me/notifications/settings");
  revalidatePath("/me/account");
  return { ok: true };
}
