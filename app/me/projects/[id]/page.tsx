import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { getProfile } from "@/lib/auth";
import {
  getAssignedProfile,
  getMyProject,
  listClientFiles,
  listClientVisibleComments,
} from "@/lib/queries/customer";
import {
  projectStatusLabels,
  type ProjectStatus,
} from "@/lib/types/db";
import { ClientFilesPanel } from "./ClientFilesPanel";
import { ClientCommentForm } from "./ClientCommentForm";
import { ActivityTimeline } from "@/components/ActivityTimeline";

export const metadata: Metadata = {
  title: "프로젝트 상세",
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

// Status order to render a simple horizontal timeline
const TIMELINE: ProjectStatus[] = [
  "queued",
  "briefing",
  "ai_draft",
  "designing",
  "review",
  "revision",
  "delivered",
  "completed",
];

export default async function MyProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getProfile();
  if (!me) return null;
  const project = await getMyProject(me.id, params.id);
  if (!project) notFound();

  const [files, comments, assigned] = await Promise.all([
    listClientFiles(project.id),
    listClientVisibleComments(project.id),
    getAssignedProfile(project.assigned_to),
  ]);

  const activeIdx = TIMELINE.indexOf(project.status);

  return (
    <div className="space-y-5">
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
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-iris transition-[width] duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="num font-display text-[13px] font-bold">
              {project.progress}%
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-caption ${TONE[project.status]}`}
            >
              {projectStatusLabels[project.status]}
            </span>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[13px] font-bold text-ink-100">
          진행 단계
        </h2>
        <ol className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {TIMELINE.map((s, i) => {
            const reached = i <= activeIdx && activeIdx >= 0;
            const isCurrent = i === activeIdx;
            return (
              <li
                key={s}
                className={`relative rounded-md px-2 py-2 text-center text-[10.5px] font-display font-bold ${
                  reached
                    ? "bg-iris/10 text-iris"
                    : "bg-ink-5 text-ink-50"
                } ${isCurrent ? "ring-2 ring-iris/50" : ""}`}
              >
                <span className="num block text-[9px] font-mono text-ink-50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{projectStatusLabels[s]}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-ink-15 bg-white p-5 lg:col-span-2">
          <header className="flex items-end justify-between">
            <h2 className="font-display text-[13px] font-bold text-ink-100">
              파일
            </h2>
            <span className="text-[11px] text-ink-50">
              운영팀이 공유한 파일만 보입니다
            </span>
          </header>
          <div className="mt-3">
            <ClientFilesPanel files={files} />
          </div>
        </section>

        <aside className="rounded-2xl border border-ink-15 bg-white p-5">
          <h2 className="font-display text-[13px] font-bold text-ink-100">
            요약
          </h2>
          <dl className="mt-3 space-y-2.5">
            <Row label="프로젝트 번호" value={project.project_no} mono />
            <Row label="상태" value={projectStatusLabels[project.status]} />
            <Row
              label="생성일"
              value={format(new Date(project.created_at), "yyyy-MM-dd")}
            />
            <Row
              label="최근 업데이트"
              value={formatDistanceToNow(new Date(project.updated_at), {
                locale: ko,
                addSuffix: true,
              })}
            />
            {project.due_date ? (
              <Row label="납기" value={project.due_date} />
            ) : null}
          </dl>
        </aside>
      </div>

      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[13px] font-bold text-ink-100">
          진행 기록
        </h2>
        <p className="mt-1 text-[11.5px] text-ink-50">
          이 프로젝트에서 발생한 운영팀·고객 이벤트 타임라인.
        </p>
        <div className="mt-4">
          <ActivityTimeline entityType="project" entityId={project.id} limit={30} />
        </div>
      </section>

      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[13px] font-bold text-ink-100">
          메시지 · 수정 요청
        </h2>
        <p className="mt-1 text-[11.5px] text-ink-50">
          운영팀과 직접 소통하세요. 수정 요청은 별도 탭에서 보내면 우선순위로 처리됩니다.
        </p>

        <div className="mt-4">
          <ClientCommentForm projectId={project.id} />
        </div>

        <div className="mt-5 divide-y divide-ink-15">
          {comments.length === 0 ? (
            <p className="py-4 text-[12.5px] text-ink-50">
              아직 등록된 메시지가 없습니다.
            </p>
          ) : (
            comments.map((c) => {
              const isRevision = c.body.startsWith("[수정 요청]");
              const isMine = c.author_id === me.id;
              const author = isMine
                ? "나"
                : c.author?.name || c.author?.email || "STUDIO BODA";
              return (
                <div key={c.id} className="py-3.5">
                  <div className="flex items-center gap-2 text-[11px] text-ink-50">
                    <span
                      className={`rounded-full px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-caption ${
                        isRevision
                          ? "bg-warning/15 text-warning"
                          : isMine
                          ? "bg-iris-light text-iris"
                          : "bg-ink-5 text-ink-70"
                      }`}
                    >
                      {isRevision ? "수정 요청" : isMine ? "내 메시지" : "운영팀"}
                    </span>
                    <span className="font-display font-bold text-ink-70">
                      {author}
                    </span>
                    <span className="text-ink-30">·</span>
                    <span>
                      {formatDistanceToNow(new Date(c.created_at), {
                        locale: ko,
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-body text-ink-100">
                    {c.body}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
      <dt className="text-[10px] font-bold uppercase tracking-caption text-ink-50">
        {label}
      </dt>
      <dd
        className={`text-right text-ink-100 ${mono ? "font-mono text-[11.5px]" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
