"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { forceKickoffProject } from "@/lib/projects/kickoff";

type Result = { ok: true } | { ok: false; error: string };

// Admin override: force a project into 진행중 without the contract being signed
// (e.g. offline/verbal agreement). Always recorded to activity_logs.
export async function forceKickoffProjectAction(
  projectId: string,
  reason: string,
): Promise<Result> {
  const me = await requireStaff();
  const trimmed = (reason || "").trim();
  if (!trimmed) {
    return { ok: false, error: "강제 착수 사유를 입력해주세요 (감사 로그에 기록됩니다)" };
  }
  const r = await forceKickoffProject(projectId, me.id, trimmed);
  if (!r.ok) return { ok: false, error: r.error ?? "처리 실패" };
  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true };
}
