const required = (name: string, value: string | undefined): string => {
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Lazy getters — never evaluated at module import time so that builds proceed
// even when env vars are temporarily missing. They throw only when a Supabase
// client is actually constructed at request time.
export const publicEnv = () => ({
  SUPABASE_URL: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  SUPABASE_ANON_KEY: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
});

export const serverEnv = () => ({
  SUPABASE_URL: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  SUPABASE_ANON_KEY: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  SUPABASE_SERVICE_ROLE_KEY: required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
});

// PayApp credentials live ONLY in Vercel env vars (never in code, DB, or chat).
// Phase 3 reads these inside the payment server actions.
export const payappEnv = () => ({
  SHOP_ID: required("PAYAPP_SHOP_ID", process.env.PAYAPP_SHOP_ID),
  API_KEY: required("PAYAPP_API_KEY", process.env.PAYAPP_API_KEY),
  LINKKEY: required("PAYAPP_LINKKEY", process.env.PAYAPP_LINKKEY),
  LINKVAL: required("PAYAPP_LINKVAL", process.env.PAYAPP_LINKVAL),
});

export const STORAGE_BUCKET = "project-files" as const;
