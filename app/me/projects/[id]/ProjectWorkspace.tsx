"use client";

import { useState, type ReactNode } from "react";
import {
  projectStatusLabels,
  type ProjectBrief,
  type ProjectDeliverable,
  type ProjectFile,
  type ProjectStatus,
  type RevisionRequest,
} from "@/lib/types/db";
import type { ProjectComment } from "@/lib/queries/customer";
import { BriefPanel } from "./BriefPanel";
import { MaterialsPanel } from "./MaterialsPanel";
import { ChatPanel } from "./ChatPanel";
import { RevisionsPanel } from "./RevisionsPanel";
import { DeliverablesPanel } from "./DeliverablesPanel";

type Tab = "overview" | "brief" | "materials" | "chat" | "revisions" | "deliverables";

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

export type ChecklistItem = { label: string; done: boolean };

export function ProjectWorkspace({
  projectId,
  status,
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

  const tabs: Array<{ key: Tab; label: string; icon: string; badge?: number; dot?: boolean }> = [
    { key: "overview", label: "개요", icon: "ti-layout-dashboard" },
    { key: "brief", label: "브리프", icon: "ti-clipboard-text", dot: !briefDone },
    { key: "materials", label: "자료실", icon: "ti-folder", badge: materials.length || undefined },
    { key: "chat", label: "채팅", icon: "ti-messages", badge: unreadCount || undefined },
    { key: "revisions", label: "수정요청", icon: "ti-pencil", badge: openRevisions || undefined },
    { key: "deliverables", label: "산출물", icon: "ti-package", badge: deliverables.length || undefined },
  ];

  const done = checklist.filter((c) => c.done).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;
  const activeIdx = TIMELINE.indexOf(status);

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

            {/* 진행 단계 */}
            <section>
              <h3 className="mb-3 font-display text-[12px] font-bold uppercase tracking-caption text-ink-50">
                진행 단계
              </h3>
              <ol className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {TIMELINE.map((s, i) => {
                  const reached = activeIdx >= 0 && i <= activeIdx;
                  const isCurrent = i === activeIdx;
                  return (
                    <li
                      key={s}
                      className={`rounded-md px-2 py-2 text-center font-display text-[10.5px] font-bold ${
                        reached ? "bg-iris/10 text-iris" : "bg-ink-5 text-ink-50"
                      } ${isCurrent ? "ring-2 ring-iris/50" : ""}`}
                    >
                      <span className="num block text-[9px] font-mono text-ink-50">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {projectStatusLabels[s]}
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* 제출 체크리스트 */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-[12px] font-bold uppercase tracking-caption text-ink-50">
                  제출 체크리스트
                </h3>
                <span className="num font-display text-[12px] font-bold text-iris">{pct}%</span>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-ink-5">
                <div className="h-full rounded-full bg-iris transition-[width] duration-500" style={{ width: `${pct}%` }} />
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
