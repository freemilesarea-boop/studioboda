"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import type {
  PortfolioImage,
  PortfolioItem,
  PortfolioMetrics,
  PortfolioProof,
  PortfolioStatus,
} from "@/lib/types/db";

const BUCKET = "portfolio-assets";
const STATUSES: PortfolioStatus[] = ["draft", "published", "archived"];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const admin = createAdminSupabase();
  const root = slugify(base) || "case";
  let candidate = root;
  for (let i = 0; i < 30; i++) {
    const query = admin
      .from("portfolio_items")
      .select("id")
      .eq("slug", candidate)
      .limit(1);
    const { data } = await query;
    const row = (data ?? [])[0] as { id: string } | undefined;
    if (!row || row.id === ignoreId) return candidate;
    candidate = `${root}-${i + 2}`;
  }
  return `${root}-${Date.now().toString(36).slice(-4)}`;
}

function safeFileName(name: string): string {
  return name.replace(/[^\w.\-가-힣 ]/g, "_").replace(/\s+/g, "_");
}

function publicUrl(path: string): string {
  const admin = createAdminSupabase();
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function parseMetrics(raw: FormDataEntryValue | null): PortfolioMetrics {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: PortfolioMetrics = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string" || typeof v === "number") out[k] = String(v);
      }
      return out;
    }
  } catch {
    // Permissive fallback: "label=value, label2=value2"
    const out: PortfolioMetrics = {};
    for (const pair of raw.split(/[\n,]/)) {
      const [k, ...rest] = pair.split("=");
      const key = k?.trim();
      const val = rest.join("=").trim();
      if (key && val) out[key] = val;
    }
    return out;
  }
  return {};
}

function getStr(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed ? trimmed : null;
}

function getBool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function getInt(fd: FormData, key: string, fallback: number): number {
  const v = fd.get(key);
  if (typeof v !== "string") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function getStatus(fd: FormData): PortfolioStatus {
  const v = fd.get("status");
  return typeof v === "string" && STATUSES.includes(v as PortfolioStatus)
    ? (v as PortfolioStatus)
    : "draft";
}

export async function createPortfolioItemAction(formData: FormData) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const title = getStr(formData, "title");
  if (!title) return { ok: false as const, error: "제목을 입력해주세요" };

  const slugInput = getStr(formData, "slug") ?? title;
  const slug = await uniqueSlug(slugInput);
  const status = getStatus(formData);

  const { data, error } = await admin
    .from("portfolio_items")
    .insert({
      title,
      slug,
      client_name: getStr(formData, "client_name"),
      brand_name: getStr(formData, "brand_name"),
      service_type: getStr(formData, "service_type"),
      category: getStr(formData, "category"),
      description: getStr(formData, "description"),
      problem: getStr(formData, "problem"),
      solution: getStr(formData, "solution"),
      result_summary: getStr(formData, "result_summary"),
      metrics: parseMetrics(formData.get("metrics")),
      status,
      is_featured: getBool(formData, "is_featured"),
      sort_order: getInt(formData, "sort_order", 0),
      published_at: status === "published" ? new Date().toISOString() : null,
      created_by: me.id,
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "생성 실패" };
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: data.id,
    action: "portfolio_item_created",
    metadata: { slug: data.slug, status },
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  revalidatePath("/");
  return { ok: true as const, id: data.id, slug: data.slug };
}

export async function updatePortfolioItemAction(
  id: string,
  formData: FormData,
) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("portfolio_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "찾을 수 없습니다" };

  const title = getStr(formData, "title") ?? existing.title;
  const slugInput = getStr(formData, "slug") ?? title;
  const slug =
    slugInput === existing.slug
      ? existing.slug
      : await uniqueSlug(slugInput, id);
  const nextStatus = getStatus(formData);
  const publishedAt =
    existing.status !== "published" && nextStatus === "published"
      ? new Date().toISOString()
      : existing.published_at;

  const patch: Partial<PortfolioItem> = {
    title,
    slug,
    client_name: getStr(formData, "client_name"),
    brand_name: getStr(formData, "brand_name"),
    service_type: getStr(formData, "service_type"),
    category: getStr(formData, "category"),
    description: getStr(formData, "description"),
    problem: getStr(formData, "problem"),
    solution: getStr(formData, "solution"),
    result_summary: getStr(formData, "result_summary"),
    metrics: parseMetrics(formData.get("metrics")),
    status: nextStatus,
    is_featured: getBool(formData, "is_featured"),
    sort_order: getInt(formData, "sort_order", existing.sort_order ?? 0),
    published_at: publishedAt,
  };

  const { error } = await admin
    .from("portfolio_items")
    .update(patch)
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: id,
    action: "portfolio_item_updated",
    metadata: { slug, status: nextStatus },
  });

  revalidatePath(`/admin/portfolio/${id}`);
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  revalidatePath(`/portfolio/${slug}`);
  if (existing.slug !== slug) revalidatePath(`/portfolio/${existing.slug}`);
  revalidatePath("/");
  return { ok: true as const, slug };
}

export async function setPortfolioStatusAction(
  id: string,
  status: PortfolioStatus,
) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("portfolio_items")
    .select("status, slug, published_at")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "찾을 수 없습니다" };

  const publishedAt =
    existing.status !== "published" && status === "published"
      ? new Date().toISOString()
      : existing.published_at;

  const { error } = await admin
    .from("portfolio_items")
    .update({ status, published_at: publishedAt })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: id,
    action: `portfolio_item_${status}`,
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  revalidatePath(`/portfolio/${existing.slug}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function setPortfolioFeaturedAction(id: string, featured: boolean) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("portfolio_items")
    .update({ is_featured: featured })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: id,
    action: featured ? "portfolio_item_featured" : "portfolio_item_unfeatured",
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  revalidatePath("/");
  return { ok: true as const };
}

export async function setPortfolioSortOrderAction(id: string, order: number) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("portfolio_items")
    .update({ sort_order: order })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: id,
    action: "portfolio_item_reordered",
    metadata: { order },
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deletePortfolioItemAction(id: string) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("portfolio_items")
    .select("slug,thumbnail_url,images,proof_files")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "찾을 수 없습니다" };

  // Best-effort cleanup of storage objects under this item's prefix
  try {
    const { data: list } = await admin.storage
      .from(BUCKET)
      .list(`portfolio_items/${id}`, { limit: 200 });
    const targets: string[] = [];
    for (const sub of ["thumbnail", "gallery", "proof"]) {
      const { data: subList } = await admin.storage
        .from(BUCKET)
        .list(`portfolio_items/${id}/${sub}`, { limit: 200 });
      for (const f of subList ?? []) {
        targets.push(`portfolio_items/${id}/${sub}/${f.name}`);
      }
    }
    for (const f of list ?? []) {
      if (f.name && !["thumbnail", "gallery", "proof"].includes(f.name)) {
        targets.push(`portfolio_items/${id}/${f.name}`);
      }
    }
    if (targets.length) {
      await admin.storage.from(BUCKET).remove(targets);
    }
  } catch {
    // Storage cleanup is best-effort; row deletion is the source of truth.
  }

  const { error } = await admin
    .from("portfolio_items")
    .delete()
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: id,
    action: "portfolio_item_deleted",
    metadata: { slug: existing.slug },
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  revalidatePath(`/portfolio/${existing.slug}`);
  revalidatePath("/");
  return { ok: true as const };
}

type Slot = "thumbnail" | "gallery" | "proof";

async function uploadOne(
  itemId: string,
  slot: Slot,
  file: File,
): Promise<{ ok: true; path: string; url: string } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: "빈 파일입니다" };
  if (file.size > 20 * 1024 * 1024)
    return { ok: false, error: "파일이 20MB를 초과합니다" };

  const admin = createAdminSupabase();
  const path = `portfolio_items/${itemId}/${slot}/${Date.now()}-${safeFileName(file.name)}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, path, url: publicUrl(path) };
}

export async function uploadPortfolioThumbnailAction(
  itemId: string,
  formData: FormData,
) {
  const me = await requireStaff();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const, error: "파일을 선택해주세요" };
  }
  const up = await uploadOne(itemId, "thumbnail", file);
  if (!up.ok) return { ok: false as const, error: up.error };

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("portfolio_items")
    .update({ thumbnail_url: up.url })
    .eq("id", itemId);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: itemId,
    action: "portfolio_thumbnail_uploaded",
    metadata: { path: up.path },
  });

  revalidatePath(`/admin/portfolio/${itemId}`);
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  revalidatePath("/");
  return { ok: true as const, url: up.url };
}

export async function uploadPortfolioGalleryAction(
  itemId: string,
  formData: FormData,
) {
  const me = await requireStaff();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return { ok: false as const, error: "파일을 선택해주세요" };
  }

  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("portfolio_items")
    .select("images")
    .eq("id", itemId)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "찾을 수 없습니다" };

  const nextImages: PortfolioImage[] = Array.isArray(existing.images)
    ? [...(existing.images as PortfolioImage[])]
    : [];

  const uploaded: PortfolioImage[] = [];
  for (const f of files) {
    const r = await uploadOne(itemId, "gallery", f);
    if (!r.ok) return { ok: false as const, error: r.error };
    const img: PortfolioImage = {
      url: r.url,
      alt: f.name.replace(/\.[^.]+$/, ""),
      type: "gallery",
    };
    uploaded.push(img);
    nextImages.push(img);
  }

  const { error } = await admin
    .from("portfolio_items")
    .update({ images: nextImages })
    .eq("id", itemId);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: itemId,
    action: "portfolio_gallery_uploaded",
    metadata: { count: uploaded.length },
  });

  revalidatePath(`/admin/portfolio/${itemId}`);
  return { ok: true as const, uploaded };
}

export async function uploadPortfolioProofAction(
  itemId: string,
  formData: FormData,
) {
  const me = await requireStaff();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return { ok: false as const, error: "파일을 선택해주세요" };
  }
  const internalDefault = getBool(formData, "internal");

  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("portfolio_items")
    .select("proof_files")
    .eq("id", itemId)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "찾을 수 없습니다" };

  const nextProof: PortfolioProof[] = Array.isArray(existing.proof_files)
    ? [...(existing.proof_files as PortfolioProof[])]
    : [];

  const uploaded: PortfolioProof[] = [];
  for (const f of files) {
    const r = await uploadOne(itemId, "proof", f);
    if (!r.ok) return { ok: false as const, error: r.error };
    const isPdf = (f.type || "").toLowerCase().includes("pdf");
    const item: PortfolioProof = {
      url: r.url,
      name: f.name,
      type: isPdf ? "pdf" : "image",
      internal: internalDefault,
    };
    uploaded.push(item);
    nextProof.push(item);
  }

  const { error } = await admin
    .from("portfolio_items")
    .update({ proof_files: nextProof })
    .eq("id", itemId);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: itemId,
    action: "portfolio_proof_uploaded",
    metadata: { count: uploaded.length, internal: internalDefault },
  });

  revalidatePath(`/admin/portfolio/${itemId}`);
  return { ok: true as const, uploaded };
}

export async function reorderPortfolioImagesAction(
  itemId: string,
  imageUrls: string[],
) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("portfolio_items")
    .select("images")
    .eq("id", itemId)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "찾을 수 없습니다" };
  const current = (existing.images ?? []) as PortfolioImage[];
  const indexed = new Map(current.map((img) => [img.url, img] as const));
  const next: PortfolioImage[] = [];
  for (const url of imageUrls) {
    const img = indexed.get(url);
    if (img) next.push(img);
  }
  // Append any images that were not in the supplied order
  for (const img of current) {
    if (!imageUrls.includes(img.url)) next.push(img);
  }
  const { error } = await admin
    .from("portfolio_items")
    .update({ images: next })
    .eq("id", itemId);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: itemId,
    action: "portfolio_gallery_reordered",
  });

  revalidatePath(`/admin/portfolio/${itemId}`);
  return { ok: true as const };
}

export async function removePortfolioImageAction(itemId: string, url: string) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("portfolio_items")
    .select("images")
    .eq("id", itemId)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "찾을 수 없습니다" };
  const next = ((existing.images ?? []) as PortfolioImage[]).filter(
    (i) => i.url !== url,
  );
  const path = pathFromPublicUrl(url);
  if (path) {
    await admin.storage.from(BUCKET).remove([path]).catch(() => {});
  }
  const { error } = await admin
    .from("portfolio_items")
    .update({ images: next })
    .eq("id", itemId);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: itemId,
    action: "portfolio_image_removed",
  });

  revalidatePath(`/admin/portfolio/${itemId}`);
  return { ok: true as const };
}

export async function removePortfolioProofAction(itemId: string, url: string) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("portfolio_items")
    .select("proof_files")
    .eq("id", itemId)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "찾을 수 없습니다" };
  const next = ((existing.proof_files ?? []) as PortfolioProof[]).filter(
    (i) => i.url !== url,
  );
  const path = pathFromPublicUrl(url);
  if (path) {
    await admin.storage.from(BUCKET).remove([path]).catch(() => {});
  }
  const { error } = await admin
    .from("portfolio_items")
    .update({ proof_files: next })
    .eq("id", itemId);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "portfolio_item",
    entity_id: itemId,
    action: "portfolio_proof_removed",
  });

  revalidatePath(`/admin/portfolio/${itemId}`);
  return { ok: true as const };
}

function pathFromPublicUrl(url: string): string | null {
  // Public URLs look like:
  //   https://<ref>.supabase.co/storage/v1/object/public/portfolio-assets/<path>
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length);
}
