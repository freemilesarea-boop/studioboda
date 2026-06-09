"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  type ProjectBrief,
  type ProjectDeliverable,
  type ProjectFile,
  type ProjectStatus,
  type RevisionRequest,
} from "@/lib/types/db";
import type { ProjectComment } from "@/lib/queries/customer";
import {
  CUSTOMER_STAGES,
  customerStage,
  displayProgress,
} from "@/lib/projects/customer-stage";
import { BriefPanel } from "./BriefPanel";
import { MaterialsPanel } from "./MaterialsPanel";
import { ChatPanel } from "./ChatPanel";
import { RevisionsPanel } from "./RevisionsPanel";
import { DeliverablesPanel } from "./DeliverablesPanel";

type Tab = "overview" | "brief" | "materials" | "chat" | "revisions" | "deliverables";

export type ChecklistItem = { label: string; done: boolean };

// ISO/date → "M/D"
function fmtShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
// due_date(YYYY-MM-DD) → "D-7" / "D-DAY" / "D+2"
function ddayLabel(due: string): string {
  const d = new Date(`${due}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "D-DAY";
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

export function ProjectWorkspace({
  projectId,
  status,
  billingStatus,
  progress,
  dueDate,
  stageDates,
  contractSigned,
  depositPaid,
  myUserId,
  brief,
  materials,
  messages,
  requests,
  deliverables,
  checklist,
  unreadCount,
  activitySlot,
}: {
  projectId: string;
  status: ProjectStatus;
  billingStatus: string;
  progress: number;
  dueDate: string | null;
  stageDates: Record<string, string>;
  contractSigned: boolean;
  depositPaid: boolean;
  myUserId: string;
  brief: ProjectBrief | null;
  materials: ProjectFile[];
  messages: ProjectComment[];
  requests: RevisionRequest[];
  deliverables: ProjectDeliverable[];
  checklist: ChecklistItem[];
  unreadCount: number;
  activitySlot: ReactNode;
}) {
  const briefDone = brief?.status === "submitted";
  const openRevisions = requests.filter((r) => r.status !== "done").length;
  const [tab, setTab] = useState<Tab>(briefDone ? "overview" : "brief");

  const stage = customerStage(status, billingStatus, {
    contractSigned,
    depositPaid,
  });
  const projectPct = displayProgress(progress, status, billingStatus);

  const tabs: Array<{ key: Tab; label: string; icon: string; badge?: number; dot?: boolean }> = [
    { key: "overview", label: "개요", icon: "ti-layout-dashboard" },
    { key: "brief", label: "브리프", icon: "ti-clipboard-text", dot: !briefDone },
    { key: "materials", label: "자료실", icon: "ti-folder", badge: materials.length || undefined },
    { key: "chat", label: "채팅", icon: "ti-messages", badge: unreadCount || undefined },
    { key: "revisions", label: "수정요청", icon: "ti-pencil", badge: openRevisions || undefined },
    { key: "deliverables", label: "산출물", icon: "ti-package", badge: deliverables.length || undefined },
  ];

  const done = checklist.filter((c) => c.done).length;
  const briefPct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-ink-15 bg-white">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-ink-15 px-2 py-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-display text-[12.5px] font-bold transition-colors ${
              tab === t.key
                ? "bg-ink-100 text-white"
                : "text-ink-70 hover:bg-ink-5"
            }`}
          >
            <i className={`ti ${t.icon} text-[15px]`} aria-hidden />
            {t.label}
            {t.badge ? (
              <span
                className={`num grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9.5px] font-bold ${
                  tab === t.key ? "bg-white/20 text-white" : "bg-iris/15 text-iris"
                }`}
              >
                {t.badge}
              </span>
            ) : null}
            {t.dot ? (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "overview" ? (
          <div className="space-y-6">
            {!briefDone ? (
              <button
                type="button"
                onClick={() => setTab("brief")}
                className="flex w-full items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-left text-[12.5px] text-warning hover:bg-warning/15"
              >
                <i className="ti ti-alert-circle text-[18px]" aria-hidden />
                <span className="flex-1">
                  <strong className="font-display font-bold">브리프를 작성해주세요.</strong>{" "}
                  제출 전까지 제작이 시작되지 않습니다.
                </span>
                <span className="font-display font-bold">작성하기 →</span>
              </button>
            ) : null}

            {/* 진행 상황 요약 + Stepper */}
            <section>
              {stage.cancelled ? (
                <div className="rounded-xl border border-error/30 bg-error/[0.05] px-4 py-3 text-[12.5px] font-bold text-error">
                  프로젝트가 취소되었습니다.
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-iris/20 bg-iris/[0.04] px-4 py-3.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-display text-[13px] font-bold text-ink-100">
                        현재 단계 ·{" "}
                        <span className="text-iris">{stage.stageLabel}</span>
                      </p>
                      <p className="num font-display text-[13px] font-bold text-iris">
                        진행률 {projectPct}%
                      </p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-iris transition-[width] duration-500"
                        style={{ width: `${projectPct}%` }}
                      />
                    </div>
                    <p className="mt-2.5 text-[12px] text-ink-70">
                      <span className="font-bold text-ink-100">지금 할 일:</span>{" "}
                      {stage.description}
                      {stage.nextLabel ? (
                        <span className="text-ink-50">
                          {" "}· 다음 단계: {stage.nextLabel}
                        </span>
                      ) : null}
                    </p>
                    {dueDate ? (
                      <p className="mt-1 text-[11.5px] text-ink-70">
                        <span className="font-bold text-ink-100">예상 납기:</span>{" "}
                        {dueDate}{" "}
                        <span className="num font-bold text-iris">
                          ({ddayLabel(dueDate)})
                        </span>
                      </p>
                    ) : null}
                    {stage.ctaLabel ? (
                      stage.ctaHref ? (
                        <Link
                          href={stage.ctaHref}
                          className="mt-2.5 inline-flex items-center rounded-lg bg-iris px-3.5 py-1.5 font-display text-[12px] font-bold text-white hover:opacity-90"
                        >
                          {stage.ctaLabel} →
                        </Link>
                      ) : stage.ctaTab ? (
                        <button
                          type="button"
                          onClick={() => setTab(stage.ctaTab as Tab)}
                          className="mt-2.5 inline-flex items-center rounded-lg bg-iris px-3.5 py-1.5 font-display text-[12px] font-bold text-white hover:opacity-90"
                        >
                          {stage.ctaLabel} →
                        </button>
                      ) : null
                    ) : null}
                  </div>

                  {/* 7단계 Stepper */}
                  <ol className="mt-4 flex items-start gap-1 overflow-x-auto pb-1">
                    {CUSTOMER_STAGES.map((s, i) => {
                      const stepNo = i + 1;
                      const isDone = stage.stepIndex > stepNo;
                      const isCurrent = stage.stepIndex === stepNo;
                      return (
                        <li key={s.key} className="flex shrink-0 items-center gap-1">
                          <div className="flex w-[60px] flex-col items-center text-center">
                            <span
                              className={`grid h-7 w-7 place-items-center rounded-full font-display text-[11px] font-bold ${
                                isDone
                                  ? "bg-iris text-white"
                                  : isCurrent
                                    ? "bg-white text-iris ring-2 ring-iris"
                                    : "bg-ink-5 text-ink-50"
                              }`}
                            >
                              {isDone ? (
                                <i className="ti ti-check text-[13px]" aria-hidden />
                              ) : (
                                stepNo
                              )}
                            </span>
                            <span
                              className={`mt-1 text-[10px] leading-tight ${
                                isCurrent
                                  ? "font-bold text-iris"
                                  : isDone
                                    ? "text-ink-70"
                                    : "text-ink-50"
                              }`}
                            >
                              {s.label}
                            </span>
                            {(isDone || isCurrent) && stageDates[s.key] ? (
                              <span className="num mt-0.5 font-mono text-[9px] text-ink-50">
                                {fmtShort(stageDates[s.key])}
                              </span>
                            ) : null}
                          </div>
                          {i < CUSTOMER_STAGES.length - 1 ? (
                            <span
                              className={`mt-3.5 h-0.5 w-4 shrink-0 ${
                                isDone ? "bg-iris" : "bg-ink-15"
                              }`}
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
            </section>

            {/* 준비 완성도 (제출 자료 체크리스트) */}
            <section>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-display text-[12px] font-bold uppercase tracking-caption text-ink-50">
                  준비 완성도 · 제출 자료
                </h3>
                <span className="num font-display text-[12px] font-bold text-iris">{briefPct}%</span>
              </div>
              <p className="mb-3 text-[11px] text-ink-50">
                프로젝트 진행률과 별개로, 제작에 필요한 자료·브리프 준비 상태입니다.
              </p>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-ink-5">
                <div className="h-full rounded-full bg-iris transition-[width] duration-500" style={{ width: `${briefPct}%` }} />
              </div>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {checklist.map((c) => (
                  <li key={c.label} className="flex items-center gap-2 text-[12.5px]">
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${
                        c.done ? "border-success bg-success text-white" : "border-ink-30 bg-white text-transparent"
                      }`}
                    >
                      <i className="ti ti-check text-[11px]" aria-hidden />
                    </span>
                    <span className={c.done ? "text-ink-100" : "text-ink-50"}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 최근 활동 (server-rendered timeline) */}
            <section>
              <h3 className="mb-3 font-display text-[12px] font-bold uppercase tracking-caption text-ink-50">
                최근 활동
              </h3>
              {activitySlot}
            </section>
          </div>
        ) : null}

        {tab === "brief" ? <BriefPanel projectId={projectId} brief={brief} /> : null}
        {tab === "materials" ? (
          <MaterialsPanel projectId={projectId} myUserId={myUserId} files={materials} />
        ) : null}
        {tab === "chat" ? (
          <ChatPanel projectId={projectId} myUserId={myUserId} messages={messages} />
        ) : null}
        {tab === "revisions" ? <RevisionsPanel projectId={projectId} requests={requests} /> : null}
        {tab === "deliverables" ? <DeliverablesPanel deliverables={deliverables} /> : null}
      </div>
    </div>
  );
}
