import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard } from "@/components/admin/Card";
import { ProjectStatusBadge, PriorityBadge } from "@/components/admin/Badge";
import type {
  Profile,
  Project,
  ProjectComment,
  ProjectFile,
} from "@/lib/types/db";
import { ProjectControls } from "./ProjectControls";
import { CommentForm } from "./CommentForm";
import { CommentsList } from "./CommentsList";
import { FilesPanel } from "./FilesPanel";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { AIToolsPanel } from "./AIToolsPanel";
import { AIAssetsList } from "./AIAssetsList";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 프로젝트 상세",
  robots: { index: false, follow: false },
};

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminSupabase();
  const [
    { data: project },
    { data: files },
    { data: comments },
    { data: staff },
  ] = await Promise.all([
    admin.from("projects").select("*").eq("id", params.id).maybeSingle(),
    admin
      .from("project_files")
      .select("*")
      .eq("project_id", params.id)
      .order("created_at", { ascending: false }),
    admin
      .from("project_comments")
      .select("*")
      .eq("project_id", params.id)
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("*")
      .in("role", ["admin", "manager", "designer"]),
  ]);
  if (!project) notFound();
  const p = project as Project;
  const team = (staff ?? []) as Profile[];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href="/admin/projects" className="hover:text-iris">
          ← 프로젝트 목록
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
            {p.title}
          </h2>
          <p className="mt-1 text-[12px] text-ink-50">
            {p.client_name}
            {p.company ? ` · ${p.company}` : ""}
            {p.service_type ? ` · ${p.service_type}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectStatusBadge status={p.status} />
          <PriorityBadge priority={p.priority} />
        </div>
      </div>

      <ProjectControls
        project={{
          id: p.id,
          status: p.status,
          priority: p.priority,
          progress: p.progress,
          due_date: p.due_date,
          assigned_to: p.assigned_to,
        }}
        team={team.map((t) => ({
          id: t.id,
          label: `${t.name ?? t.email} · ${t.role}`,
        }))}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <AdminCard title="파일" className="lg:col-span-2">
          <FilesPanel
            projectId={p.id}
            files={(files ?? []) as ProjectFile[]}
          />
        </AdminCard>

        <AdminCard title="활동 타임라인">
          <ActivityTimeline
            entityType="project"
            entityId={p.id}
            limit={40}
            showRawAction
          />
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <AdminCard
          title="AI 어시스턴트"
          className="lg:col-span-2"
        >
          <AIToolsPanel projectId={p.id} />
        </AdminCard>
        <AdminCard title="AI 자산 히스토리">
          <AIAssetsList projectId={p.id} />
        </AdminCard>
      </div>

      <AdminCard title="댓글 · 내부 메모">
        <CommentForm projectId={p.id} />
        <div className="mt-4">
          <CommentsList
            projectId={p.id}
            initial={(comments ?? []) as ProjectComment[]}
          />
        </div>
      </AdminCard>
    </div>
  );
}
