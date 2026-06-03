"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { projectSchema, type ProjectInput } from "@/lib/schemas";
import type {
  FileFolder,
  Priority,
  ProjectStatus,
  RevisionStatus,
  Visibility,
} from "@/lib/types/db";
import { STORAGE_BUCKET } from "@/lib/env";
import { createNotification } from "@/lib/notifications";

export async function updateProjectAction(id: string, input: Partial<ProjectInput>) {
  const me = await requireStaff();
  const parsed = projectSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("projects")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: id,
    action: "updated",
    metadata: { fields: Object.keys(parsed.data) },
  });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  return { ok: true as const };
}

export async function setProjectStatusAction(id: string, status: ProjectStatus) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("projects")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: id,
    action: "status_changed",
    metadata: { status },
  });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  return { ok: true as const };
}

export async function setProjectPriorityAction(id: string, priority: Priority) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("projects")
    .update({ priority })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: id,
    action: "priority_changed",
    metadata: { priority },
  });

  revalidatePath(`/admin/projects/${id}`);
  return { ok: true as const };
}

export async function setProjectProgressAction(id: string, progress: number) {
  const me = await requireStaff();
  const safe = Math.max(0, Math.min(100, Math.round(progress)));
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("projects")
    .update({ progress: safe })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: id,
    action: "progress_changed",
    metadata: { progress: safe },
  });

  revalidatePath(`/admin/projects/${id}`);
  return { ok: true as const };
}

export async function addCommentAction(
  projectId: string,
  body: string,
  isInternal: boolean,
) {
  const me = await requireStaff();
  const trimmed = body.trim();
  if (!trimmed) return { ok: false as const, error: "내용을 입력해주세요" };

  const admin = createAdminSupabase();
  const { error } = await admin.from("project_comments").insert({
    project_id: projectId,
    author_id: me.id,
    body: trimmed,
    is_internal: isInternal,
  });
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: projectId,
    action: "comment_added",
    metadata: { is_internal: isInternal },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true as const };
}

export async function uploadProjectFileAction(
  projectId: string,
  formData: FormData,
) {
  const me = await requireStaff();
  const file = formData.get("file");
  const visibility = (formData.get("visibility") as Visibility) || "internal";
  const folderRaw = (formData.get("folder") as string) || "draft";
  const folder: FileFolder = (
    ["draft", "revision", "final"] as const
  ).includes(folderRaw as FileFolder)
    ? (folderRaw as FileFolder)
    : "draft";
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "파일을 선택해주세요" };
  }
  if (file.size > 25 * 1024 * 1024) {
    return { ok: false as const, error: "파일이 25MB 를 초과합니다" };
  }

  const admin = createAdminSupabase();
  const safeName = file.name.replace(/[^\w.\-가-힣 ]/g, "_");
  const path = `${projectId}/${folder}/${Date.now()}-${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) return { ok: false as const, error: upErr.message };

  const { error: rowErr } = await admin.from("project_files").insert({
    project_id: projectId,
    file_name: file.name,
    file_path: path,
    file_type: file.type || null,
    file_size: file.size,
    uploaded_by: me.id,
    visibility,
    folder,
    is_final: folder === "final",
  });
  if (rowErr) return { ok: false as const, error: rowErr.message };

  // Notify the project owner when a client-visible file is shared
  if (visibility === "client") {
    const { data: project } = await admin
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .maybeSingle();
    if (project?.user_id) {
      const { createNotification } = await import("@/lib/notifications");
      void createNotification(project.user_id, "file_uploaded", {
        project_id: projectId,
        file_name: file.name,
        folder,
      });
    }
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: projectId,
    action: "file_uploaded",
    metadata: { file_name: file.name, file_size: file.size, visibility },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true as const };
}

export async function deleteProjectFileAction(fileId: string) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: row, error } = await admin
    .from("project_files")
    .select("*")
    .eq("id", fileId)
    .maybeSingle();
  if (error || !row) {
    return { ok: false as const, error: error?.message ?? "파일을 찾을 수 없습니다" };
  }
  await admin.storage.from(STORAGE_BUCKET).remove([row.file_path]);
  await admin.from("project_files").delete().eq("id", fileId);

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: row.project_id,
    action: "file_deleted",
    metadata: { file_name: row.file_name },
  });

  revalidatePath(`/admin/projects/${row.project_id}`);
  return { ok: true as const };
}

export async function signedFileUrlAction(filePath: string) {
  await requireStaff();
  const admin = createAdminSupabase();
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, 60 * 10);
  if (error || !data) return { ok: false as const, error: error?.message ?? "URL 발급 실패" };
  return { ok: true as const, url: data.signedUrl };
}

// ============================================================
// Phase 4 — Project Workspace (admin side)
// ============================================================

// ── 수정요청 상태 변경 (staff) ──────────────────────────────────────
export async function updateRevisionStatusAction(
  revisionId: string,
  status: RevisionStatus,
  adminNote?: string,
) {
  const me = await requireStaff();
  const valid: RevisionStatus[] = ["requested", "reviewing", "in_progress", "done"];
  if (!valid.includes(status)) {
    return { ok: false as const, error: "올바르지 않은 상태입니다" };
  }
  const admin = createAdminSupabase();
  const { data: row } = await admin
    .from("revision_requests")
    .select("id,project_id,status,title")
    .eq("id", revisionId)
    .maybeSingle();
  if (!row) return { ok: false as const, error: "수정 요청을 찾을 수 없습니다" };

  const patch: Record<string, unknown> = { status };
  if (typeof adminNote === "string") patch.admin_note = adminNote.trim().slice(0, 2000);
  if (status === "done") patch.resolved_at = new Date().toISOString();
  const { error } = await admin.from("revision_requests").update(patch).eq("id", revisionId);
  if (error) return { ok: false as const, error: error.message };

  // History preserved: every transition is recorded (no row deletion).
  await logActivity({
    actor_id: me.id,
    entity_type: "revision_request",
    entity_id: revisionId,
    action: "status_changed",
    metadata: { from: row.status, to: status, project_id: row.project_id },
  });

  // Notify the customer when their revision is resolved.
  if (status === "done") {
    const { data: project } = await admin
      .from("projects")
      .select("user_id")
      .eq("id", row.project_id)
      .maybeSingle();
    if (project?.user_id) {
      void createNotification(project.user_id, "project_update", {
        project_id: row.project_id,
        status_label: `수정 요청 완료 · ${row.title}`,
      });
    }
  }

  revalidatePath(`/admin/projects/${row.project_id}`);
  revalidatePath(`/me/projects/${row.project_id}`);
  return { ok: true as const };
}

// ── 산출물 업로드 (staff, versioned, direct-to-storage) ─────────────
export async function createDeliverableUploadUrlAction(
  projectId: string,
  fileName: string,
) {
  await requireStaff();
  const admin = createAdminSupabase();
  const allowed = ["zip", "pdf", "png", "jpg", "jpeg", "mp4", "webp", "ai", "psd"];
  const ext = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase()
    : "";
  if (!allowed.includes(ext)) {
    return { ok: false as const, error: `허용되지 않는 형식입니다 (.${ext || "?"})` };
  }
  const safeName = fileName.replace(/[^\w.\-가-힣 ]/g, "_").slice(0, 180);
  const path = `${projectId}/deliverables/${Date.now()}-${safeName}`;
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "업로드 URL 발급 실패" };
  }
  return { ok: true as const, path: data.path, token: data.token };
}

export async function confirmDeliverableUploadAction(
  projectId: string,
  input: {
    path: string;
    fileName: string;
    size: number;
    type: string | null;
    title: string;
    notes?: string;
  },
) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  if (!input.path.startsWith(`${projectId}/deliverables/`)) {
    return { ok: false as const, error: "잘못된 업로드 경로입니다" };
  }
  const title = (input.title || input.fileName).trim().slice(0, 200);

  // Next version = max(version)+1 for this project; demote previous latest.
  const { data: last } = await admin
    .from("project_deliverables")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (last?.version ?? 0) + 1;

  await admin
    .from("project_deliverables")
    .update({ is_latest: false })
    .eq("project_id", projectId)
    .eq("is_latest", true);

  const { error } = await admin.from("project_deliverables").insert({
    project_id: projectId,
    version: nextVersion,
    title,
    file_name: input.fileName,
    file_path: input.path,
    file_type: input.type,
    file_size: input.size,
    notes: (input.notes ?? "").trim().slice(0, 2000) || null,
    is_latest: true,
    uploaded_by: me.id,
  });
  if (error) return { ok: false as const, error: error.message };

  // Mark project delivered + notify customer.
  const { data: project } = await admin
    .from("projects")
    .select("user_id,title")
    .eq("id", projectId)
    .maybeSingle();
  await admin
    .from("projects")
    .update({ status: "delivered" })
    .eq("id", projectId)
    .not("status", "in", "(completed,cancelled)");
  if (project?.user_id) {
    void createNotification(project.user_id, "final_delivery_uploaded", {
      project_id: projectId,
      title: project.title,
      version: nextVersion,
    });
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: projectId,
    action: "deliverable_uploaded",
    metadata: { version: nextVersion, file_name: input.fileName, size: input.size },
  });
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/me/projects/${projectId}`);
  return { ok: true as const, version: nextVersion };
}

export async function deleteDeliverableAction(deliverableId: string) {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { data: row } = await admin
    .from("project_deliverables")
    .select("*")
    .eq("id", deliverableId)
    .maybeSingle();
  if (!row) return { ok: false as const, error: "산출물을 찾을 수 없습니다" };
  await admin.storage.from(STORAGE_BUCKET).remove([row.file_path]);
  await admin.from("project_deliverables").delete().eq("id", deliverableId);

  // If we removed the latest, promote the newest remaining one.
  if (row.is_latest) {
    const { data: newest } = await admin
      .from("project_deliverables")
      .select("id")
      .eq("project_id", row.project_id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (newest) {
      await admin
        .from("project_deliverables")
        .update({ is_latest: true })
        .eq("id", newest.id);
    }
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: row.project_id,
    action: "deliverable_deleted",
    metadata: { version: row.version, file_name: row.file_name },
  });
  revalidatePath(`/admin/projects/${row.project_id}`);
  return { ok: true as const };
}
