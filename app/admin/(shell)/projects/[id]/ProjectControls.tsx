"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setProjectPriorityAction,
  setProjectProgressAction,
  setProjectStatusAction,
  updateProjectAction,
} from "@/lib/actions/projects";
import type { Priority, ProjectStatus } from "@/lib/types/db";
import {
  priorityLabels,
  projectStatusLabels,
} from "@/lib/types/db";
import { AdminCard } from "@/components/admin/Card";
import { useToast } from "@/components/admin/Toast";

const STATUSES: ProjectStatus[] = [
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
const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];

export function ProjectControls({
  project,
  team,
}: {
  project: {
    id: string;
    status: ProjectStatus;
    priority: Priority;
    progress: number;
    due_date: string | null;
    assigned_to: string | null;
  };
  team: { id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState(project.progress);
  const [due, setDue] = useState(project.due_date ?? "");
  const [assigned, setAssigned] = useState(project.assigned_to ?? "");
  const { push } = useToast();
  const router = useRouter();

  function call<T>(fn: () => Promise<T>, success: string) {
    startTransition(async () => {
      const r = (await fn()) as { ok: boolean; error?: string };
      if (r.ok) {
        push(success);
        router.refresh();
      } else {
        push(r.error ?? "실패", "error");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <AdminCard title="상태">
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending || s === project.status}
              onClick={() => call(() => setProjectStatusAction(project.id, s), "상태 변경")}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                s === project.status
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30 disabled:opacity-50"
              }`}
            >
              {projectStatusLabels[s]}
            </button>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="우선순위 · 진행률">
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map((pr) => (
            <button
              key={pr}
              type="button"
              disabled={pending || pr === project.priority}
              onClick={() =>
                call(() => setProjectPriorityAction(project.id, pr), "우선순위 변경")
              }
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                pr === project.priority
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30 disabled:opacity-50"
              }`}
            >
              {priorityLabels[pr]}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
              {progress}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="flex-1 accent-iris"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                call(
                  () => setProjectProgressAction(project.id, progress),
                  "진행률 저장",
                )
              }
              className="rounded-md bg-ink-100 px-3 py-1 text-[11px] font-bold text-white disabled:opacity-60"
            >
              저장
            </button>
          </label>
        </div>
      </AdminCard>

      <AdminCard title="담당 · 납기">
        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
            담당자
          </span>
          <select
            value={assigned}
            onChange={(e) => setAssigned(e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-ink-15 bg-white px-2.5 text-[13px] outline-none focus:border-iris/60"
          >
            <option value="">미지정</option>
            {team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block">
          <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
            납기일
          </span>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-ink-15 bg-white px-2.5 text-[13px] outline-none focus:border-iris/60"
          />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            call(
              () =>
                updateProjectAction(project.id, {
                  assigned_to: assigned || null,
                  due_date: due || null,
                }),
              "저장됨",
            )
          }
          className="mt-3 h-10 w-full rounded-lg bg-ink-100 font-display text-[12.5px] font-bold text-white hover:bg-ink-90 disabled:opacity-60"
        >
          저장
        </button>
      </AdminCard>
    </div>
  );
}
