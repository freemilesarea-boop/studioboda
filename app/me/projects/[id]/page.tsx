import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getProfile } from "@/lib/auth";
import {
  getAssignedProfile,
  getMyProject,
  getProjectBrief,
  getProjectReadAt,
  listClientVisibleComments,
  listDeliverables,
  listProjectMaterials,
  listRevisionRequests,
} from "@/lib/queries/customer";
import {
  fileCategoryLabels,
  projectStatusLabels,
  type FileCategory,
  type ProjectStatus,
} from "@/lib/types/db";
import { RealtimeProjectRefresh } from "./RealtimeProjectRefresh";
import { ProjectWorkspace, type ChecklistItem } from "./ProjectWorkspace";
import { ActivityTimeline } from "@/components/ActivityTimeline";

export const metadata: Metadata = {
  title: "프로젝트 워크스페이스",
  robots: { index: false, follow: false },
};

const TONE: Record<ProjectStatus, string> = {
  queued: "bg-ink-15 text-ink-70",
  briefing: "bg-iris/15 text-iris",
  ai_draft: "bg-iris/15 text-iris",
  designing: "bg-sky/15 text-sky",
  review: "bg-warning/15 text-warning",
  revision: "bg-warning/15 text-warning",
  delivered: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  cancelled: "bg-error/15 text-error",
};

export default async function MyProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getProfile();
  if (!me) return null;
  const project = await getMyProject(me.id, params.id);
  if (!project) notFound();

  const [brief, materials, messages, requests, deliverables, assigned, readAt] =
    await Promise.all([
      getProjectBrief(project.id),
      listProjectMaterials(project.id),
      listClientVisibleComments(project.id),
      listRevisionRequests(project.id),
      listDeliverables(project.id),
      getAssignedProfile(project.assigned_to),
      getProjectReadAt(project.id, me.id),
    ]);

  // Unread = messages from others newer than my last read.
  const readMs = readAt ? new Date(readAt).getTime() : 0;
  const unreadCount = messages.filter(
    (m) => m.author_id !== me.id && new Date(m.created_at).getTime() > readMs,
  ).length;

  // Submission checklist (auto completion).
  const hasCategory = (c: FileCategory) =>
    materials.some((f) => f.uploaded_by === me.id && f.category === c);
  const checklist: ChecklistItem[] = [
    { label: fileCategoryLabels.logo, done: hasCategory("logo") },
    { label: fileCategoryLabels.product, done: hasCategory("product") },
    {
      label: "참고자료",
      done: hasCategory("reference") || Boolean(brief?.reference_urls?.trim()),
    },
    { label: "기획문서", done: hasCategory("document") },
    { label: "브랜드 소개", done: brief?.status === "submitted" },
  ];

  return (
    <div className="space-y-5">
      <RealtimeProjectRefresh projectId={project.id} />
      <Link
        href="/me/projects"
        className="inline-flex items-center gap-1 text-[12px] text-ink-50 hover:text-iris"
      >
        ← 프로젝트 목록
      </Link>

      <header className="rounded-2xl border border-ink-90 bg-ink-100 px-6 py-7 text-white sm:px-8 sm:py-9">
        <div className="relative">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-iris-grad opacity-25 blur-3xl" />
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris-glow">
            Project · {project.project_no}
          </p>
          <h1 className="mt-2 font-display text-[24px] font-extrabold leading-[1.15] tracking-display sm:text-[28px]">
            {project.title}
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-30">
            {project.service_type ?? "—"}
            {project.due_date ? ` · 납기 ${project.due_date}` : ""}
            {assigned ? ` · 담당 ${assigned.name ?? assigned.email}` : ""}
            {` · 생성 ${format(new Date(project.created_at), "yyyy-MM-dd")}`}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-iris transition-[width] duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="num font-display text-[13px] font-bold">{project.progress}%</span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-caption ${TONE[project.status]}`}
            >
              {projectStatusLabels[project.status]}
            </span>
          </div>
        </div>
      </header>

      <ProjectWorkspace
        projectId={project.id}
        status={project.status}
        myUserId={me.id}
        brief={brief}
        materials={materials}
        messages={messages}
        requests={requests}
        deliverables={deliverables}
        checklist={checklist}
        unreadCount={unreadCount}
        activitySlot={
          <ActivityTimeline entityType="project" entityId={project.id} limit={20} />
        }
      />
    </div>
  );
}
