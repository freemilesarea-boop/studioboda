import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

// Service-role client. NEVER import from a client component.
// Bypasses RLS — use only for trusted server operations.
export function createAdminSupabase() {
  const env = serverEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAdminAuthSupabase() {
  return createAdminSupabase();
}
