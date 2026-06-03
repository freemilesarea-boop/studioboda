"use client";

import { createBrowserSupabase } from "@/lib/supabase/browser";
import { STORAGE_BUCKET } from "@/lib/env";

// Uploads a file directly to Supabase Storage using a one-shot signed token
// produced by a server action. This bypasses the serverless request-body cap
// so files up to 100MB go straight to storage from the browser.
export async function uploadToSignedUrl(
  path: string,
  token: string,
  file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createBrowserSupabase();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type || "application/octet-stream",
    });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export const fmtSize = (n: number | null | undefined) => {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};
