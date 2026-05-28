"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { inquirySchema, type InquiryInput } from "@/lib/schemas";
import type { InquiryStatus } from "@/lib/types/db";

export async function createInquiryAction(input: InquiryInput) {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "유효하지 않은 입력입니다",
    };
  }
  // Honeypot — if filled, silently succeed without inserting.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return { ok: true as const };
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("inquiries")
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      company: parsed.data.company ?? null,
      service_type: parsed.data.service_type ?? null,
      budget_range: parsed.data.budget_range ?? null,
      message: parsed.data.message ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await logActivity({
    entity_type: "inquiry",
    entity_id: data.id,
    action: "created",
    metadata: { source: "website", service_type: parsed.data.service_type },
  });

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  return { ok: true as const, id: data.id };
}

export async function updateInquiryStatusAction(id: string, status: InquiryStatus) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("inquiries")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "inquiry",
    entity_id: id,
    action: "status_changed",
    metadata: { status },
  });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
  return { ok: true as const };
}
