import { createAdminSupabase } from "@/lib/supabase/admin";

const safeAdmin = () => {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
};

export type NotificationChannels = { email: boolean; kakao: boolean };

export async function getNotificationChannels(): Promise<NotificationChannels> {
  const admin = safeAdmin();
  if (!admin) return { email: true, kakao: false };
  const { data } = await admin
    .from("notification_settings")
    .select("value")
    .eq("key", "channels")
    .maybeSingle();
  const v = (data?.value ?? {}) as Record<string, unknown>;
  return { email: v.email !== false, kakao: v.kakao === true };
}

export type DeliveryRow = {
  id: string;
  event_type: string;
  channel: string;
  status: string;
  template_code: string | null;
  to_address: string | null;
  error: string | null;
  created_at: string;
};

/** Recent per-channel delivery audit for the admin dashboard. */
export async function recentDeliveries(limit = 40): Promise<DeliveryRow[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("notification_deliveries")
    .select("id, event_type, channel, status, template_code, to_address, error, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as DeliveryRow[];
}
