import Link from "next/link";
import { format } from "date-fns";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import {
  PriorityBadge,
  ProjectStatusBadge,
} from "@/components/admin/Badge";
import type { Project, ProjectStatus } from "@/lib/types/db";
import { projectStatusLabels } from "@/lib/types/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Projects",
  robots: { index: false, follow: false },
};

const STATUSES: (ProjectStatus | "all")[] = [
  "all",
  "queued",
  "briefing",
  "ai_draft",
  "designing",
  "review",
  "revision",
  "delivered",
  "completed",
  "cancelled",
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = (
    STATUSES.includes(searchParams.status as ProjectStatus | "all")
      ? searchParams.status
      : "all"
  ) as ProjectStatus | "all";
  const admin = createAdminSupabase();
  let query = admin
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query;
  const rows = (data ?? []) as Project[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
            Projects
          </p>
          <h2 className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.4px] text-ink-100">
            프로젝트 운영
          </h2>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/projects${s === "all" ? "" : `?status=${s}`}`}
            className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
              s === status
                ? "border-ink-100 bg-ink-100 text-white"
                : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
            }`}
          >
            {s === "all" ? "전체" : projectStatusLabels[s as ProjectStatus]}
          </Link>
        ))}
      </div>

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyState
            title="진행 중인 프로젝트가 없습니다"
            description="견적이 수락되면 프로젝트가 자동 생성됩니다."
          />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="min-w-full text-left text-[12.5px]">
              <thead className="border-b border-ink-15 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
                <tr>
                  <th className="px-5 py-2.5">제목 / 클라이언트</th>
                  <th className="px-3 py-2.5">상태</th>
                  <th className="px-3 py-2.5">우선순위</th>
                  <th className="px-3 py-2.5">진행</th>
                  <th className="px-3 py-2.5">납기</th>
                  <th className="px-5 py-2.5 text-right">생성</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-15">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-ink-5">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="block font-display font-bold text-ink-100 hover:text-iris"
                      >
                        {p.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-ink-50">
                        {p.client_name}
                        {p.company ? ` · ${p.company}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <ProjectStatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-3">
                      <PriorityBadge priority={p.priority} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-15">
                          <div
                            className="h-full rounded-full bg-iris"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="num text-[11px] font-bold text-ink-70">
                          {p.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ink-70">{p.due_date ?? "—"}</td>
                    <td className="px-5 py-3 text-right text-[11px] text-ink-50">
                      {format(new Date(p.created_at), "yyyy-MM-dd")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
