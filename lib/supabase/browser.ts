"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv, BODA_SCHEMA } from "@/lib/env";

export function createBrowserSupabase() {
  const env = publicEnv();
  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    db: { schema: BODA_SCHEMA },
  });
}

export function createBrowserAuthSupabase() {
  const env = publicEnv();
  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
