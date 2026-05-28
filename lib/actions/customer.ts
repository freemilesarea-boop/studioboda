"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { notifyStaff } from "@/lib/notifications";
import { getProfile } from "@/lib/auth";
import { STORAGE_BUCKET } from "@/lib/env";

async function requireMember() {
  const me = await getProfile();
  if (!me) throw new Error("로그인이 필요합니다");
  return me;
}

// ---- Quote accept / reject ----------------------------------------
export async function acceptMyQuoteAction(quoteId: string) {
  const me = await requireMember();
  const admin = createAdminSupabase();
  const { data: quote } = await admin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("user_id", me.id)
    .maybeSingle();
  if (!quote) {
    return { ok: false as const, error: "견적을 찾을 수 없거나 권한이 없습니다" };
  }
  if (!["sent", "customer_review", "draft"].includes(quote.status)) {
    return {
      ok: false as const,
      error: `현재 상태(${quote.status})에서는 수락할 수 없습니다`,
    };
  }
  const { error } = await admin
    .from("quotes")
    .update({
      status: "accepted",
      customer_accepted_at: new Date().toISOString(),
    })
    .eq("id", quoteId);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "quote",
    entity_id: quoteId,
    action: "customer_accepted",
    metadata: { total_price: quote.total_price },
  });

  revalidatePath("/me/quotes");
  revalidatePath(`/me/quotes/${quoteId}`);
  revalidatePath("/me");
  return { ok: true as const };
}

export async function rejectMyQuoteAction(quoteId: string, reason: string) {
  const me = await requireMember();
  const trimmed = (reason || "").trim().slice(0, 1000);
  const admin = createAdminSupabase();
  const { data: quote } = await admin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("user_id", me.id)
    .maybeSingle();
  if (!quote) {
    return { ok: false as const, error: "견적을 찾을 수 없거나 권한이 없습니다" };
  }
  if (!["sent", "customer_review", "draft"].includes(quote.status)) {
    return {
      ok: false as const,
      error: `현재 상태(${quote.status})에서는 거절할 수 없습니다`,
    };
  }

  const newNotes = trimmed
    ? `${quote.notes ? quote.notes + "\n\n" : ""}[고객 거절 사유]\n${trimmed}`
    : quote.notes;

  const { error } = await admin
    .from("quotes")
    .update({
      status: "rejected",
      customer_rejected_at: new Date().toISOString(),
      notes: newNotes,
    })
    .eq("id", quoteId);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "quote",
    entity_id: quoteId,
    action: "customer_rejected",
    metadata: { reason: trimmed || null },
  });

  revalidatePath("/me/quotes");
  revalidatePath(`/me/quotes/${quoteId}`);
  return { ok: true as const };
}

// ---- Project comments / revision requests --------------------------
export async function postMyCommentAction(
  projectId: string,
  body: string,
  asRevision: boolean,
) {
  const me = await requireMember();
  const text = (body || "").trim();
  if (!text) return { ok: false as const, error: "내용을 입력해주세요" };

  // Verify ownership
  const admin = createAdminSupabase();
  const { data: project } = await admin
    .from("projects")
    .select("id,user_id")
    .eq("id", projectId)
    .eq("user_id", me.id)
    .maybeSingle();
  if (!project) {
    return { ok: false as const, error: "프로젝트를 찾을 수 없습니다" };
  }

  const tagged = asRevision ? `[수정 요청] ${text}` : text;
  const { error } = await admin.from("project_comments").insert({
    project_id: projectId,
    author_id: me.id,
    body: tagged,
    is_internal: false,
  });
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: projectId,
    action: asRevision ? "revision_requested" : "client_comment_posted",
    metadata: { length: tagged.length },
  });

  // If revision request, also flip project status so admin sees the queue.
  if (asRevision) {
    await admin
      .from("projects")
      .update({ status: "revision" })
      .eq("id", projectId)
      .in("status", ["review", "designing", "ai_draft", "delivered"]);
  }

  // Notify staff (revision requests are high-signal; regular messages too)
  void notifyStaff(
    asRevision ? "revision_requested" : "comment_posted",
    { project_id: projectId, by: me.id, length: tagged.length },
  );

  revalidatePath(`/me/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/me");
  return { ok: true as const };
}

// ---- File download (signed URL) -----------------------------------
export async function getClientFileUrlAction(fileId: string) {
  const me = await requireMember();
  const admin = createAdminSupabase();
  const { data: row } = await admin
    .from("project_files")
    .select("*, project:projects!project_id(user_id)")
    .eq("id", fileId)
    .maybeSingle();

  if (!row) return { ok: false as const, error: "파일을 찾을 수 없습니다" };
  if (row.visibility !== "client") {
    return { ok: false as const, error: "접근 권한이 없는 파일입니다" };
  }
  const projectOwner = (row as { project?: { user_id: string } | null })
    .project?.user_id;
  if (projectOwner !== me.id) {
    return { ok: false as const, error: "접근 권한이 없는 파일입니다" };
  }

  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(row.file_path, 60 * 10, {
      download: row.file_name,
    });
  if (error || !data) {
    return {
      ok: false as const,
      error: error?.message ?? "다운로드 URL 발급 실패",
    };
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: row.project_id,
    action: "file_downloaded",
    metadata: { file_id: fileId, file_name: row.file_name },
  });

  return { ok: true as const, url: data.signedUrl };
}
