"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv, BODA_SCHEMA } from "@/lib/env";

export function createBrowserSupabase() {
  return createBrowserClient(publicEnv.SUPABASE_URL, publicEnv.SUPABASE_ANON_KEY, {
    db: { schema: BODA_SCHEMA },
  });
}

export function createBrowserAuthSupabase() {
  return createBrowserClient(publicEnv.SUPABASE_URL, publicEnv.SUPABASE_ANON_KEY);
}
