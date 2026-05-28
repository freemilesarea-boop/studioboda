"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { getProfile, requireStaff } from "@/lib/auth";

type BrandInput = {
  user_id?: string; // staff path only
  brand_name?: string;
  brand_colors?: string;
  reference_sites?: string;
  tone?: string;
  forbidden_expressions?: string;
  go_to_phrases?: string;
  notes?: string;
};

function clean(input: BrandInput): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const k of [
    "brand_name",
    "brand_colors",
    "reference_sites",
    "tone",
    "forbidden_expressions",
    "go_to_phrases",
    "notes",
  ] as const) {
    const v = input[k];
    out[k] = typeof v === "string" && v.trim() ? v.slice(0, 4000) : null;
  }
  return out;
}

export async function saveMyBrandAction(input: BrandInput) {
  const me = await getProfile();
  if (!me) return { ok: false as const, error: "로그인이 필요합니다" };
  const admin = createAdminSupabase();
  const payload = { user_id: me.id, ...clean(input) };
  const { error } = await admin
    .from("brand_profiles")
    .upsert(payload, { onConflict: "user_id" });
  if (error) return { ok: false as const, error: error.message };
  await logActivity({
    actor_id: me.id,
    entity_type: "profile",
    entity_id: me.id,
    action: "brand_profile_updated",
  });
  revalidatePath("/me/brand");
  return { ok: true as const };
}

export async function saveBrandForUserAction(
  userId: string,
  input: BrandInput,
) {
  const me = await requireStaff();
  if (!userId) return { ok: false as const, error: "userId 필요" };
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("brand_profiles")
    .upsert({ user_id: userId, ...clean(input) }, { onConflict: "user_id" });
  if (error) return { ok: false as const, error: error.message };
  await logActivity({
    actor_id: me.id,
    entity_type: "profile",
    entity_id: userId,
    action: "brand_profile_updated_by_staff",
  });
  revalidatePath(`/admin/members/${userId}/brand`);
  revalidatePath("/me/brand");
  return { ok: true as const };
}
