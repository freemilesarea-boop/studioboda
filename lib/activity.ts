import { createAdminSupabase } from "@/lib/supabase/admin";

export type ActivityInput = {
  actor_id?: string | null;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(input: ActivityInput) {
  const admin = createAdminSupabase();
  await admin.from("activity_logs").insert({
    actor_id: input.actor_id ?? null,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    action: input.action,
    metadata: input.metadata ?? {},
  });
}
