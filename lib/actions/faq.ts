"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

export async function upsertFaqItemAction(formData: FormData): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const id = String(formData.get("id") ?? "").trim() || null;
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") ?? 0) || 0;
  const active = formData.get("active") !== "off";
  if (!question || !answer) {
    return { ok: false, error: "질문과 답변을 입력해주세요" };
  }

  const payload = {
    question,
    answer,
    category_id: categoryId,
    sort_order: sortOrder,
    active,
  };

  if (id) {
    const { error } = await admin.from("faq_items").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await admin.from("faq_items").insert(payload);
    if (error) return { ok: false, error: error.message };
  }
  await logActivity({
    actor_id: me.id,
    entity_type: "faq",
    entity_id: id,
    action: id ? "faq_updated" : "faq_created",
  });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}

export async function deleteFaqItemAction(id: string): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  await admin
    .from("faq_items")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", id);
  await logActivity({
    actor_id: me.id,
    entity_type: "faq",
    entity_id: id,
    action: "faq_deleted",
  });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}

export async function upsertFaqCategoryAction(
  formData: FormData,
): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const key =
    String(formData.get("key") ?? "").trim() ||
    name.toLowerCase().replace(/\s+/g, "-");
  const sortOrder = Number(formData.get("sort_order") ?? 0) || 0;
  if (!name) return { ok: false, error: "카테고리명을 입력해주세요" };

  const payload = { name, key, sort_order: sortOrder };
  if (id) {
    const { error } = await admin.from("faq_categories").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await admin.from("faq_categories").insert(payload);
    if (error) return { ok: false, error: error.message };
  }
  await logActivity({
    actor_id: me.id,
    entity_type: "faq_category",
    entity_id: id,
    action: id ? "faq_category_updated" : "faq_category_created",
  });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}
