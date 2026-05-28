"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { quoteSchema, type QuoteInput } from "@/lib/schemas";
import type { QuoteOption, QuoteStatus } from "@/lib/types/db";

const totalFor = (base: number, options: QuoteOption[]) =>
  options.reduce((sum, o) => sum + (o.price ?? 0), base);

export async function createQuoteAction(input: QuoteInput) {
  await requireStaff();
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }
  const total = totalFor(parsed.data.base_price, parsed.data.options);
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("quotes")
    .insert({
      ...parsed.data,
      total_price: total,
    })
    .select("id")
    .single();
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    entity_type: "quote",
    entity_id: data.id,
    action: "created",
    metadata: { total_price: total, status: parsed.data.status },
  });

  if (parsed.data.inquiry_id) {
    await admin
      .from("inquiries")
      .update({ status: "quoted" })
      .eq("id", parsed.data.inquiry_id);
  }

  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
  return { ok: true as const, id: data.id };
}

export async function updateQuoteAction(id: string, input: QuoteInput) {
  await requireStaff();
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }
  const total = totalFor(parsed.data.base_price, parsed.data.options);
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("quotes")
    .update({ ...parsed.data, total_price: total })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    entity_type: "quote",
    entity_id: id,
    action: "updated",
    metadata: { total_price: total },
  });

  revalidatePath("/admin/quotes");
  return { ok: true as const };
}

export async function setQuoteStatusAction(id: string, status: QuoteStatus) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: quote, error: fetchErr } = await admin
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !quote) {
    return { ok: false as const, error: fetchErr?.message ?? "견적을 찾을 수 없습니다" };
  }

  const { error } = await admin
    .from("quotes")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "quote",
    entity_id: id,
    action: status === "accepted" ? "accepted" : status === "sent" ? "sent" : "status_changed",
    metadata: { status },
  });

  // accepted → auto-create project
  if (status === "accepted") {
    let clientName = "";
    let company: string | null = null;
    if (quote.inquiry_id) {
      const { data: inq } = await admin
        .from("inquiries")
        .select("name,company")
        .eq("id", quote.inquiry_id)
        .maybeSingle();
      clientName = inq?.name ?? "";
      company = inq?.company ?? null;
      await admin
        .from("inquiries")
        .update({ status: "converted" })
        .eq("id", quote.inquiry_id);
    }
    const { data: created, error: pErr } = await admin
      .from("projects")
      .insert({
        quote_id: id,
        inquiry_id: quote.inquiry_id,
        client_name: clientName || quote.title,
        company,
        title: quote.title,
        service_type: quote.service_type,
        status: "queued",
        priority: "normal",
        progress: 0,
      })
      .select("id")
      .single();
    if (!pErr && created) {
      await logActivity({
        actor_id: me.id,
        entity_type: "project",
        entity_id: created.id,
        action: "created",
        metadata: { from_quote: id },
      });
    }
  }

  revalidatePath("/admin/quotes");
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  return { ok: true as const };
}
