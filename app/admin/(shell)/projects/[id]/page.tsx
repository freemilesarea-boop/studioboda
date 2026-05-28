import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import { ProjectStatusBadge, PriorityBadge } from "@/components/admin/Badge";
import type {
  ActivityLog,
  Profile,
  Project,
  ProjectComment,
  ProjectFile,
} from "@/lib/types/db";
import { ProjectControls } from "./ProjectControls";
import { CommentForm } from "./CommentForm";
import { FilesPanel } from "./FilesPanel";

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
    { data: activity },
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
      .from("activity_logs")
      .select("*")
      .eq("entity_type", "project")
      .eq("entity_id", params.id)
      .order("created_at", { ascending: false })
      .limit(20),
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
          {(activity ?? []).length === 0 ? (
            <EmptyState title="아직 활동이 없습니다" />
          ) : (
            <ul className="space-y-2">
              {((activity ?? []) as ActivityLog[]).map((a) => (
                <li
                  key={a.id}
                  className="rounded-md border border-ink-15 px-3 py-2 text-[12px]"
                >
                  <p className="font-display font-bold text-ink-100">
                    {a.action}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-50">
                    {format(new Date(a.created_at), "yyyy-MM-dd HH:mm")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard title="댓글 · 내부 메모">
        <CommentForm projectId={p.id} />
        <div className="mt-4 divide-y divide-ink-15">
          {((comments ?? []) as ProjectComment[]).length === 0 ? (
            <p className="py-4 text-[12.5px] text-ink-50">아직 코멘트가 없습니다.</p>
          ) : (
            ((comments ?? []) as ProjectComment[]).map((c) => (
              <div key={c.id} className="py-3">
                <div className="flex items-center gap-2 text-[11px] text-ink-50">
                  <span
                    className={`rounded-full px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.08em] ${
                      c.is_internal
                        ? "bg-warning/15 text-warning"
                        : "bg-iris/10 text-iris"
                    }`}
                  >
                    {c.is_internal ? "내부" : "클라이언트"}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(c.created_at), {
                      locale: ko,
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-[1.65] text-ink-100">
                  {c.body}
                </p>
              </div>
            ))
          )}
        </div>
      </AdminCard>
    </div>
  );
}
