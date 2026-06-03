"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerAuthSupabase } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { inquirySchema, type InquiryInput } from "@/lib/schemas";
import { getProfile } from "@/lib/auth";
import { INQUIRY_BUCKET } from "@/lib/env";
import {
  INQUIRY_FILE_CATEGORIES,
  type InquiryFileCategory,
  type InquiryStatus,
} from "@/lib/types/db";

const INQUIRY_FILE_EXTS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "zip",
] as const;
const INQUIRY_FILE_MAX = 100 * 1024 * 1024;
// Upload tokens are only issued for very recently created inquiries — this
// bounds abuse of the public (unauthenticated) upload endpoint.
const UPLOAD_WINDOW_MS = 2 * 60 * 60 * 1000;

const extOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
};
const safeFileName = (name: string) =>
  name.replace(/[^\w.\-가-힣 ]/g, "_").slice(0, 180);

// Confirms an inquiry exists and is within the upload window. Returns the row
// or null. Used by both the upload-URL and confirm actions (public endpoints).
async function recentInquiry(inquiryId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("inquiries")
    .select("id, created_at")
    .eq("id", inquiryId)
    .maybeSingle();
  if (!data) return null;
  if (Date.now() - new Date(data.created_at).getTime() > UPLOAD_WINDOW_MS) {
    return null;
  }
  return data as { id: string; created_at: string };
}

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

  // Attach the inquiry to the logged-in user if there is one.
  const authClient = createServerAuthSupabase();
  const {
    data: { user },
  } = await authClient.auth.getUser();

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
      user_id: user?.id ?? null,
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

// ============================================================
// Phase 4.1 — Inquiry reference attachments
// ============================================================

// Public (anonymous-allowed): issue a one-shot signed upload URL for a freshly
// created inquiry. Direct browser → Storage upload bypasses the serverless body
// cap so files up to 100MB are supported.
export async function createInquiryUploadUrlAction(
  inquiryId: string,
  fileName: string,
) {
  const inquiry = await recentInquiry(inquiryId);
  if (!inquiry) {
    return { ok: false as const, error: "유효하지 않은 문의입니다" };
  }
  const ext = extOf(fileName);
  if (!(INQUIRY_FILE_EXTS as readonly string[]).includes(ext)) {
    return { ok: false as const, error: `허용되지 않는 파일 형식입니다 (.${ext || "?"})` };
  }
  const path = `${inquiryId}/${Date.now()}-${safeFileName(fileName)}`;
  const admin = createAdminSupabase();
  const { data, error } = await admin.storage
    .from(INQUIRY_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "업로드 URL 발급 실패" };
  }
  return { ok: true as const, path: data.path, token: data.token };
}

// Public (anonymous-allowed): record an uploaded attachment row.
export async function confirmInquiryFileAction(
  inquiryId: string,
  input: {
    path: string;
    fileName: string;
    size: number;
    mime: string | null;
    category: InquiryFileCategory;
  },
) {
  const inquiry = await recentInquiry(inquiryId);
  if (!inquiry) {
    return { ok: false as const, error: "유효하지 않은 문의입니다" };
  }
  if (input.size > INQUIRY_FILE_MAX) {
    return { ok: false as const, error: "파일이 100MB를 초과합니다" };
  }
  if (!INQUIRY_FILE_CATEGORIES.includes(input.category)) {
    return { ok: false as const, error: "올바르지 않은 분류입니다" };
  }
  if (!input.path.startsWith(`${inquiryId}/`)) {
    return { ok: false as const, error: "잘못된 업로드 경로입니다" };
  }
  const admin = createAdminSupabase();
  const { error } = await admin.from("inquiry_files").insert({
    inquiry_id: inquiryId,
    file_name: input.fileName,
    file_path: input.path,
    file_size: input.size,
    mime_type: input.mime,
    category: input.category,
  });
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    entity_type: "inquiry",
    entity_id: inquiryId,
    action: "file_attached",
    metadata: { file_name: input.fileName, category: input.category, size: input.size },
  });
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return { ok: true as const };
}

// Staff download — signed URL (service role).
export async function getInquiryFileUrlAction(fileId: string) {
  await requireStaff();
  const admin = createAdminSupabase();
  const { data: row } = await admin
    .from("inquiry_files")
    .select("file_path,file_name")
    .eq("id", fileId)
    .maybeSingle();
  if (!row) return { ok: false as const, error: "파일을 찾을 수 없습니다" };
  const { data, error } = await admin.storage
    .from(INQUIRY_BUCKET)
    .createSignedUrl(row.file_path, 60 * 10, { download: row.file_name });
  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "다운로드 URL 발급 실패" };
  }
  return { ok: true as const, url: data.signedUrl };
}

// Customer download — only files attached to the caller's own inquiry.
export async function getMyInquiryFileUrlAction(fileId: string) {
  const me = await getProfile();
  if (!me) return { ok: false as const, error: "로그인이 필요합니다" };
  const admin = createAdminSupabase();
  const { data: row } = await admin
    .from("inquiry_files")
    .select("file_path,file_name, inquiry:inquiries!inquiry_id(user_id,email)")
    .eq("id", fileId)
    .maybeSingle();
  if (!row) return { ok: false as const, error: "파일을 찾을 수 없습니다" };
  const rawInq = (row as unknown as {
    inquiry?:
      | { user_id: string | null; email: string | null }
      | { user_id: string | null; email: string | null }[]
      | null;
  }).inquiry;
  const inq = Array.isArray(rawInq) ? rawInq[0] ?? null : rawInq;
  const owns =
    inq?.user_id === me.id ||
    (!!inq?.email && !!me.email && inq.email.toLowerCase() === me.email.toLowerCase());
  if (!owns) return { ok: false as const, error: "접근 권한이 없습니다" };
  const { data, error } = await admin.storage
    .from(INQUIRY_BUCKET)
    .createSignedUrl(row.file_path, 60 * 10, { download: row.file_name });
  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "다운로드 URL 발급 실패" };
  }
  return { ok: true as const, url: data.signedUrl };
}
