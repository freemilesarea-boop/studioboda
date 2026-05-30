"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import type { CaseStudyMetric, CaseStudyStatus } from "@/lib/types/db";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const STATUSES: CaseStudyStatus[] = ["draft", "published", "archived"];

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9가-힣]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "case"
  );
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const admin = createAdminSupabase();
  const root = slugify(base);
  let candidate = root;
  for (let i = 0; i < 30; i++) {
    const { data } = await admin
      .from("case_studies")
      .select("id")
      .eq("slug", candidate)
      .limit(1);
    const row = (data ?? [])[0] as { id: string } | undefined;
    if (!row || row.id === ignoreId) return candidate;
    candidate = `${root}-${i + 2}`;
  }
  return `${root}-${Date.now().toString(36).slice(-4)}`;
}

function s(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  if (typeof v !== "string") return null;
  return v.trim() || null;
}

function parseMetrics(raw: string | null): CaseStudyMetric[] {
  if (!raw) return [];
  // "라벨=값=증감" per line (증감 optional)
  const out: CaseStudyMetric[] = [];
  for (const line of raw.split(/\n/)) {
    const [label, value, delta] = line.split("=").map((x) => x.trim());
    if (label && value) out.push({ label, value, delta: delta || undefined });
  }
  return out;
}

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function createCaseStudyAction(
  formData: FormData,
): Promise<Result<{ id: string; slug: string }>> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const title = s(formData, "title");
  if (!title) return { ok: false, error: "제목을 입력해주세요" };
  const statusRaw = s(formData, "status");
  const status: CaseStudyStatus = STATUSES.includes(statusRaw as CaseStudyStatus)
    ? (statusRaw as CaseStudyStatus)
    : "draft";
  const slug = await uniqueSlug(s(formData, "slug") ?? title);

  const { data, error } = await admin
    .from("case_studies")
    .insert({
      title,
      slug,
      subtitle: s(formData, "subtitle"),
      client_name: s(formData, "client_name"),
      service_type: s(formData, "service_type"),
      category: s(formData, "category"),
      summary: s(formData, "summary"),
      problem: s(formData, "problem"),
      solution: s(formData, "solution"),
      result_summary: s(formData, "result_summary"),
      tech_stack: parseList(s(formData, "tech_stack")),
      metrics: parseMetrics(s(formData, "metrics")),
      thumbnail_url: s(formData, "thumbnail_url"),
      cover_url: s(formData, "cover_url"),
      status,
      is_featured: formData.get("is_featured") === "on",
      published_at: status === "published" ? new Date().toISOString() : null,
      created_by: me.id,
    })
    .select("id, slug")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "생성 실패" };

  await logActivity({
    actor_id: me.id,
    entity_type: "case_study",
    entity_id: data.id,
    action: "case_study_created",
    metadata: { slug: data.slug },
  });
  revalidatePath("/admin/case-studies");
  revalidatePath("/case-studies");
  return { ok: true, id: data.id, slug: data.slug };
}

export async function updateCaseStudyAction(
  id: string,
  formData: FormData,
): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("case_studies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "찾을 수 없습니다" };

  const title = s(formData, "title") ?? existing.title;
  const statusRaw = s(formData, "status");
  const status: CaseStudyStatus = STATUSES.includes(statusRaw as CaseStudyStatus)
    ? (statusRaw as CaseStudyStatus)
    : (existing.status as CaseStudyStatus);
  const slugInput = s(formData, "slug") ?? title;
  const slug =
    slugInput === existing.slug ? existing.slug : await uniqueSlug(slugInput, id);
  const publishedAt =
    existing.status !== "published" && status === "published"
      ? new Date().toISOString()
      : existing.published_at;

  const { error } = await admin
    .from("case_studies")
    .update({
      title,
      slug,
      subtitle: s(formData, "subtitle"),
      client_name: s(formData, "client_name"),
      service_type: s(formData, "service_type"),
      category: s(formData, "category"),
      summary: s(formData, "summary"),
      problem: s(formData, "problem"),
      solution: s(formData, "solution"),
      result_summary: s(formData, "result_summary"),
      tech_stack: parseList(s(formData, "tech_stack")),
      metrics: parseMetrics(s(formData, "metrics")),
      thumbnail_url: s(formData, "thumbnail_url"),
      cover_url: s(formData, "cover_url"),
      status,
      is_featured: formData.get("is_featured") === "on",
      published_at: publishedAt,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "case_study",
    entity_id: id,
    action: "case_study_updated",
  });
  revalidatePath("/admin/case-studies");
  revalidatePath(`/admin/case-studies/${id}`);
  revalidatePath("/case-studies");
  return { ok: true };
}

export async function deleteCaseStudyAction(id: string): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  // Soft delete
  await admin
    .from("case_studies")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("id", id);
  await logActivity({
    actor_id: me.id,
    entity_type: "case_study",
    entity_id: id,
    action: "case_study_deleted",
  });
  revalidatePath("/admin/case-studies");
  revalidatePath("/case-studies");
  return { ok: true };
}
