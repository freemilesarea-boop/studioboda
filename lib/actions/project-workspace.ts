"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { notifyStaff } from "@/lib/notifications";
import { getProfile } from "@/lib/auth";
import { STORAGE_BUCKET } from "@/lib/env";
import {
  FILE_CATEGORIES,
  PRODUCTION_TYPES,
  type FileCategory,
  type ProductionType,
  type RevisionAttachment,
  type RevisionPriority,
} from "@/lib/types/db";

type Ok<T = unknown> = { ok: true } & T;
type Err = { ok: false; error: string };
type Res<T = unknown> = Ok<T> | Err;

const ok = <T,>(v?: T): Ok<T> => ({ ok: true, ...(v ?? ({} as T)) });
const err = (e: string): Err => ({ ok: false, error: e });

// Upload kinds → storage sub-folder + size/extension policy.
const UPLOAD_KINDS = {
  material: {
    folder: "materials",
    maxBytes: 100 * 1024 * 1024,
    exts: ["jpg", "jpeg", "png", "webp", "pdf", "doc", "docx", "ppt", "pptx", "zip"],
  },
  chat: {
    folder: "chat",
    maxBytes: 25 * 1024 * 1024,
    exts: ["jpg", "jpeg", "png", "webp", "gif", "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip"],
  },
  revision: {
    folder: "revisions",
    maxBytes: 50 * 1024 * 1024,
    exts: ["jpg", "jpeg", "png", "webp", "pdf", "doc", "docx", "ppt", "pptx", "zip", "mp4"],
  },
} as const;
type UploadKind = keyof typeof UPLOAD_KINDS;

const extOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
};

const safe = (name: string) => name.replace(/[^\w.\-가-힣 ]/g, "_").slice(0, 180);

type ProjectRow = { id: string; user_id: string | null; title: string; status: string };
type Guard =
  | { ok: false; error: string }
  | {
      ok: true;
      me: NonNullable<Awaited<ReturnType<typeof getProfile>>>;
      project: ProjectRow;
      admin: ReturnType<typeof createAdminSupabase>;
    };

async function ownProject(projectId: string): Promise<Guard> {
  const me = await getProfile();
  if (!me) return { ok: false, error: "로그인이 필요합니다" };
  const admin = createAdminSupabase();
  const { data: project } = await admin
    .from("projects")
    .select("id,user_id,title,status")
    .eq("id", projectId)
    .eq("user_id", me.id)
    .maybeSingle();
  if (!project) return { ok: false, error: "프로젝트를 찾을 수 없거나 권한이 없습니다" };
  return { ok: true, me, project: project as ProjectRow, admin };
}

// ── Generic signed upload URL (direct browser → Storage) ─────────────
// Server actions on Vercel cap request bodies (~4.5MB), so large files
// (up to 100MB) are uploaded straight to Storage with a one-shot token.
export async function createWorkspaceUploadUrlAction(
  projectId: string,
  kind: UploadKind,
  fileName: string,
): Promise<Res<{ path: string; token: string }>> {
  const guard = await ownProject(projectId);
  if (!guard.ok) return err(guard.error);
  const cfg = UPLOAD_KINDS[kind];
  if (!cfg) return err("알 수 없는 업로드 유형");
  const ext = extOf(fileName);
  if (!(cfg.exts as readonly string[]).includes(ext)) {
    return err(`허용되지 않는 파일 형식입니다 (.${ext || "?"})`);
  }
  const path = `${projectId}/${cfg.folder}/${Date.now()}-${safe(fileName)}`;
  const { data, error } = await guard.admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) return err(error?.message ?? "업로드 URL 발급 실패");
  return ok({ path: data.path, token: data.token });
}

// ── 자료실: confirm a customer material upload ───────────────────────
export async function confirmMaterialUploadAction(
  projectId: string,
  input: {
    path: string;
    fileName: string;
    size: number;
    type: string | null;
    category: FileCategory;
  },
): Promise<Res> {
  const guard = await ownProject(projectId);
  if (!guard.ok) return err(guard.error);
  if (input.size > UPLOAD_KINDS.material.maxBytes) {
    return err("파일이 100MB를 초과합니다");
  }
  if (!FILE_CATEGORIES.includes(input.category)) {
    return err("올바르지 않은 분류입니다");
  }
  // Guard against path tampering — must live under this project's tree.
  if (!input.path.startsWith(`${projectId}/materials/`)) {
    return err("잘못된 업로드 경로입니다");
  }
  const { error } = await guard.admin.from("project_files").insert({
    project_id: projectId,
    file_name: input.fileName,
    file_path: input.path,
    file_type: input.type,
    file_size: input.size,
    uploaded_by: guard.me.id,
    visibility: "client",
    folder: "draft",
    category: input.category,
    is_final: false,
  });
  if (error) return err(error.message);

  void notifyStaff("file_uploaded", {
    project_id: projectId,
    file_name: input.fileName,
    by: guard.me.id,
    category: input.category,
  });
  await logActivity({
    actor_id: guard.me.id,
    entity_type: "project",
    entity_id: projectId,
    action: "client_material_uploaded",
    metadata: { file_name: input.fileName, category: input.category, size: input.size },
  });
  revalidatePath(`/me/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  return ok();
}

export async function deleteMaterialAction(fileId: string): Promise<Res> {
  const me = await getProfile();
  if (!me) return err("로그인이 필요합니다");
  const admin = createAdminSupabase();
  const { data: row } = await admin
    .from("project_files")
    .select("*, project:projects!project_id(user_id)")
    .eq("id", fileId)
    .maybeSingle();
  if (!row) return err("파일을 찾을 수 없습니다");
  const owner = (row as { project?: { user_id: string } | null }).project?.user_id;
  if (owner !== me.id || row.uploaded_by !== me.id || row.is_final) {
    return err("삭제 권한이 없습니다");
  }
  await admin.storage.from(STORAGE_BUCKET).remove([row.file_path]);
  await admin.from("project_files").delete().eq("id", fileId);
  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: row.project_id,
    action: "client_material_deleted",
    metadata: { file_name: row.file_name },
  });
  revalidatePath(`/me/projects/${row.project_id}`);
  return ok();
}

// ── 브리프: save / submit ────────────────────────────────────────────
export type BriefInput = {
  company_name: string;
  manager_name: string;
  contact_phone: string;
  contact_email: string;
  production_type: string;
  purpose: string;
  target_audience: string;
  desired_mood: string;
  reference_urls: string;
  competitor_urls: string;
  must_requirements: string;
};

export async function saveBriefAction(
  projectId: string,
  input: BriefInput,
  submit: boolean,
): Promise<Res> {
  const guard = await ownProject(projectId);
  if (!guard.ok) return err(guard.error);

  const clean = (v: string | undefined, n = 2000) => (v ?? "").trim().slice(0, n);
  const production = PRODUCTION_TYPES.includes(input.production_type as ProductionType)
    ? input.production_type
    : "기타";

  if (submit) {
    // Minimum fields required to submit (project can't proceed otherwise).
    const required: Array<[string, string]> = [
      ["회사명", clean(input.company_name, 200)],
      ["담당자명", clean(input.manager_name, 100)],
      ["연락처", clean(input.contact_phone, 50)],
      ["제작 목적", clean(input.purpose)],
      ["필수 요청사항", clean(input.must_requirements)],
    ];
    const missing = required.filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) {
      return err(`다음 항목을 입력해주세요: ${missing.join(", ")}`);
    }
  }

  const payload = {
    project_id: projectId,
    company_name: clean(input.company_name, 200),
    manager_name: clean(input.manager_name, 100),
    contact_phone: clean(input.contact_phone, 50),
    contact_email: clean(input.contact_email, 200),
    production_type: production,
    purpose: clean(input.purpose),
    target_audience: clean(input.target_audience),
    desired_mood: clean(input.desired_mood),
    reference_urls: clean(input.reference_urls),
    competitor_urls: clean(input.competitor_urls),
    must_requirements: clean(input.must_requirements),
    status: submit ? "submitted" : "draft",
    submitted_at: submit ? new Date().toISOString() : null,
  };

  const { error } = await guard.admin
    .from("project_briefs")
    .upsert(payload, { onConflict: "project_id" });
  if (error) return err(error.message);

  if (submit) {
    // Brief submitted → if project is still queued/briefing, advance to ai_draft
    // so the operations team picks it up. Idempotent / non-destructive.
    await guard.admin
      .from("projects")
      .update({ status: "ai_draft" })
      .eq("id", projectId)
      .in("status", ["queued", "briefing"]);
    void notifyStaff("comment_posted", {
      project_id: projectId,
      by: guard.me.id,
      kind: "brief_submitted",
    });
  }
  await logActivity({
    actor_id: guard.me.id,
    entity_type: "project",
    entity_id: projectId,
    action: submit ? "brief_submitted" : "brief_saved",
    metadata: { production_type: production },
  });
  revalidatePath(`/me/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  return ok();
}

// ── 채팅: send message (reuses project_comments) ─────────────────────
export async function sendChatMessageAction(
  projectId: string,
  body: string,
  attachments: RevisionAttachment[] = [],
): Promise<Res> {
  const guard = await ownProject(projectId);
  if (!guard.ok) return err(guard.error);
  const text = (body ?? "").trim().slice(0, 4000);
  const atts = (attachments ?? []).slice(0, 10).filter((a) => a?.path);
  if (!text && atts.length === 0) return err("내용을 입력해주세요");
  // Confirm every attachment lives under this project's chat tree.
  for (const a of atts) {
    if (!a.path.startsWith(`${projectId}/chat/`)) {
      return err("잘못된 첨부 경로입니다");
    }
  }

  const { error } = await guard.admin.from("project_comments").insert({
    project_id: projectId,
    author_id: guard.me.id,
    body: text || "(첨부 파일)",
    is_internal: false,
    attachments: atts,
  });
  if (error) return err(error.message);

  // Sender has implicitly read up to now.
  await guard.admin
    .from("project_read_state")
    .upsert(
      { project_id: projectId, user_id: guard.me.id, last_read_at: new Date().toISOString() },
      { onConflict: "project_id,user_id" },
    );

  void notifyStaff("comment_posted", {
    project_id: projectId,
    by: guard.me.id,
    length: text.length,
  });
  await logActivity({
    actor_id: guard.me.id,
    entity_type: "project",
    entity_id: projectId,
    action: "client_chat_message",
    metadata: { length: text.length, attachments: atts.length },
  });
  revalidatePath(`/me/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  return ok();
}

export async function markProjectReadAction(projectId: string): Promise<Res> {
  const guard = await ownProject(projectId);
  if (!guard.ok) return err(guard.error);
  await guard.admin
    .from("project_read_state")
    .upsert(
      { project_id: projectId, user_id: guard.me.id, last_read_at: new Date().toISOString() },
      { onConflict: "project_id,user_id" },
    );
  return ok();
}

// ── 수정요청 ─────────────────────────────────────────────────────────
export async function createRevisionAction(
  projectId: string,
  input: {
    title: string;
    content: string;
    priority: RevisionPriority;
    attachments?: RevisionAttachment[];
  },
): Promise<Res> {
  const guard = await ownProject(projectId);
  if (!guard.ok) return err(guard.error);
  const title = (input.title ?? "").trim().slice(0, 200);
  const content = (input.content ?? "").trim().slice(0, 4000);
  if (!title) return err("제목을 입력해주세요");
  if (!content) return err("내용을 입력해주세요");
  const priority: RevisionPriority = (["low", "normal", "high"] as const).includes(
    input.priority,
  )
    ? input.priority
    : "normal";
  const atts = (input.attachments ?? []).slice(0, 10).filter((a) => a?.path);
  for (const a of atts) {
    if (!a.path.startsWith(`${projectId}/revisions/`)) {
      return err("잘못된 첨부 경로입니다");
    }
  }

  const { error } = await guard.admin.from("revision_requests").insert({
    project_id: projectId,
    requester_id: guard.me.id,
    title,
    content,
    priority,
    attachments: atts,
    status: "requested",
  });
  if (error) return err(error.message);

  // Flag the project so the operations team sees a revision queue.
  await guard.admin
    .from("projects")
    .update({ status: "revision" })
    .eq("id", projectId)
    .in("status", ["review", "designing", "ai_draft", "delivered"]);

  void notifyStaff("revision_requested", {
    project_id: projectId,
    by: guard.me.id,
    title,
    priority,
  });
  await logActivity({
    actor_id: guard.me.id,
    entity_type: "project",
    entity_id: projectId,
    action: "revision_requested",
    metadata: { title, priority },
  });
  revalidatePath(`/me/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  return ok();
}

// ── 산출물: customer download (signed URL, ownership verified) ────────
export async function downloadDeliverableAction(
  deliverableId: string,
  preview = false,
): Promise<Res<{ url: string }>> {
  const me = await getProfile();
  if (!me) return err("로그인이 필요합니다");
  const admin = createAdminSupabase();
  const { data: row } = await admin
    .from("project_deliverables")
    .select("*, project:projects!project_id(user_id)")
    .eq("id", deliverableId)
    .maybeSingle();
  if (!row) return err("산출물을 찾을 수 없습니다");
  const owner = (row as { project?: { user_id: string } | null }).project?.user_id;
  if (owner !== me.id) return err("접근 권한이 없습니다");

  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(row.file_path, 60 * 10, preview ? {} : { download: row.file_name });
  if (error || !data) return err(error?.message ?? "다운로드 URL 발급 실패");

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: row.project_id,
    action: "deliverable_downloaded",
    metadata: { deliverable_id: deliverableId, version: row.version },
  });
  return ok({ url: data.signedUrl });
}

// ── Generic attachment download (chat / revision / material) ─────────
export async function downloadProjectAttachmentAction(
  projectId: string,
  path: string,
  fileName: string,
  preview = false,
): Promise<Res<{ url: string }>> {
  const guard = await ownProject(projectId);
  if (!guard.ok) return err(guard.error);
  if (!path.startsWith(`${projectId}/`)) return err("접근 권한이 없습니다");
  const { data, error } = await guard.admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 60 * 10, preview ? {} : { download: fileName });
  if (error || !data) return err(error?.message ?? "다운로드 URL 발급 실패");
  return ok({ url: data.signedUrl });
}
