"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff, getProfile } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { notifyStaff } from "@/lib/notifications";
import type { ReviewStatus } from "@/lib/types/db";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

// ---- Customer: submit a review (enters pending moderation) ----
export async function submitReviewAction(formData: FormData): Promise<Result> {
  const me = await getProfile();
  if (!me) return { ok: false, error: "로그인이 필요합니다" };

  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 10) {
    return { ok: false, error: "후기는 10자 이상 작성해주세요" };
  }
  const ratingRaw = Number(formData.get("rating"));
  const rating = Number.isFinite(ratingRaw)
    ? Math.min(5, Math.max(1, Math.round(ratingRaw)))
    : 5;
  const title = String(formData.get("title") ?? "").trim() || null;
  const projectId = String(formData.get("project_id") ?? "").trim() || null;

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("reviews")
    .insert({
      author_id: me.id,
      project_id: projectId,
      author_name: me.name || me.company_name || null,
      company: me.account_type === "business" ? me.company_name : null,
      rating,
      title,
      body: body.slice(0, 4000),
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "등록 실패" };

  await logActivity({
    actor_id: me.id,
    entity_type: "review",
    entity_id: data.id,
    action: "review_submitted",
    metadata: { rating },
  });
  void notifyStaff("review_requested", { review_id: data.id, rating });

  revalidatePath("/reviews");
  revalidatePath("/me/reviews");
  return { ok: true };
}

// ---- Admin: moderate ----
export async function setReviewStatusAction(
  id: string,
  status: ReviewStatus,
): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const patch: Record<string, unknown> = { status };
  if (status === "approved") {
    patch.approved_by = me.id;
    patch.approved_at = new Date().toISOString();
  }
  const { error } = await admin.from("reviews").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    actor_id: me.id,
    entity_type: "review",
    entity_id: id,
    action: `review_${status}`,
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  return { ok: true };
}

export async function toggleReviewFeaturedAction(
  id: string,
  featured: boolean,
): Promise<Result> {
  await requireStaff();
  const admin = createAdminSupabase();
  await admin.from("reviews").update({ is_featured: featured }).eq("id", id);
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  return { ok: true };
}
