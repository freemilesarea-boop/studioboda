import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getProfile } from "@/lib/auth";
import { listMyProjects } from "@/lib/queries/customer";
import {
  projectStatusLabels,
  type ProjectStatus,
} from "@/lib/types/db";

export const metadata: Metadata = {
  title: "내 프로젝트",
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

export default async function MyProjectsPage() {
  const me = await getProfile();
  if (!me) return null;
  const projects = await listMyProjects(me.id);

  return (
    <div className="space-y-5">
      <header>
        <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
          Projects
        </p>
        <h1 className="mt-1 font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
          내 프로젝트{" "}
          <span className="num ml-1.5 text-[13px] font-bold text-ink-50">
            {projects.length}
          </span>
        </h1>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-12 text-center">
          <i className="ti ti-folders text-[26px] text-ink-30" aria-hidden />
          <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
            아직 진행 중인 프로젝트가 없습니다
          </p>
          <p className="mt-1 text-[12px] text-ink-50">
            견적이 수락되면 자동으로 프로젝트가 시작됩니다.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {projects.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl border border-ink-15 bg-white px-4 py-4 sm:px-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/me/projects/${p.id}`}
                    className="block truncate font-display text-[14px] font-bold text-ink-100 hover:text-iris"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-0.5 truncate text-[11.5px] text-ink-50">
                    {p.service_type ?? "—"}
                    {p.due_date ? ` · 납기 ${p.due_date}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption ${TONE[p.status]}`}
                >
                  {projectStatusLabels[p.status]}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-15">
                  <div
                    className="h-full rounded-full bg-iris transition-[width] duration-500"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <span className="num text-[11px] font-bold text-ink-70">
                  {p.progress}%
                </span>
                <span className="text-[11px] text-ink-50">
                  · 생성 {format(new Date(p.created_at), "MM-dd")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
