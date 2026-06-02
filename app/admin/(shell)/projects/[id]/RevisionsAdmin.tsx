"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { updateRevisionStatusAction, signedFileUrlAction } from "@/lib/actions/projects";
import {
  revisionPriorityLabels,
  revisionStatusLabels,
  type RevisionAttachment,
  type RevisionPriority,
  type RevisionRequest,
  type RevisionStatus,
} from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";

const STATUS_TONE: Record<RevisionStatus, string> = {
  requested: "bg-ink-15 text-ink-70",
  reviewing: "bg-sky/15 text-sky",
  in_progress: "bg-warning/15 text-warning",
  done: "bg-success/15 text-success",
};
const PRIORITY_TONE: Record<RevisionPriority, string> = {
  low: "text-ink-50",
  normal: "text-ink-70",
  high: "text-error",
};
const FLOW: RevisionStatus[] = ["requested", "reviewing", "in_progress", "done"];

export function RevisionsAdmin({ requests }: { requests: RevisionRequest[] }) {
  if (requests.length === 0) {
    return <p className="text-[12.5px] text-ink-50">접수된 수정 요청이 없습니다.</p>;
  }
  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <RevisionRow key={r.id} r={r} />
      ))}
    </ul>
  );
}

function RevisionRow({ r }: { r: RevisionRequest }) {
  const [note, setNote] = useState(r.admin_note ?? "");
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function setStatus(status: RevisionStatus) {
    startTransition(async () => {
      const res = await updateRevisionStatusAction(r.id, status, note);
      if (res.ok) {
        push(`상태 변경: ${revisionStatusLabels[status]}`, "success");
        router.refresh();
      } else push(res.error ?? "변경 실패", "error");
    });
  }

  function saveNote() {
    startTransition(async () => {
      const res = await updateRevisionStatusAction(r.id, r.status, note);
      if (res.ok) {
        push("메모 저장됨", "success");
        router.refresh();
      } else push(res.error ?? "저장 실패", "error");
    });
  }

  function openAtt(a: RevisionAttachment) {
    startTransition(async () => {
      const res = await signedFileUrlAction(a.path);
      if (res.ok && res.url) window.open(res.url, "_blank", "noopener");
      else push("링크 발급 실패", "error");
    });
  }

  return (
    <li className="rounded-xl border border-ink-15 bg-white p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_TONE[r.status]}`}>
          {revisionStatusLabels[r.status]}
        </span>
        <h4 className="font-display text-[13px] font-bold text-ink-100">{r.title}</h4>
        <span className={`ml-auto text-[11px] font-bold ${PRIORITY_TONE[r.priority]}`}>
          {revisionPriorityLabels[r.priority]}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-body text-ink-70">{r.content}</p>

      {r.attachments?.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {r.attachments.map((a, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => openAtt(a)}
                className="inline-flex items-center gap-1 rounded-md border border-ink-15 bg-ink-5 px-2 py-0.5 text-[11px] font-bold text-ink-70 hover:border-iris hover:text-iris"
              >
                <i className="ti ti-paperclip text-[12px]" aria-hidden />
                <span className="max-w-[150px] truncate">{a.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {FLOW.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            disabled={pending || s === r.status}
            className={`rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors ${
              s === r.status
                ? "border-ink-100 bg-ink-100 text-white"
                : "border-ink-15 bg-white text-ink-70 hover:border-ink-30 disabled:opacity-50"
            }`}
          >
            {revisionStatusLabels[s]}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="운영팀 메모 (고객에게 표시)"
          className="h-8 flex-1 rounded-md border border-ink-15 bg-white px-2.5 text-[12px] outline-none focus:border-iris/60"
        />
        <button
          type="button"
          onClick={saveNote}
          disabled={pending}
          className="h-8 rounded-md border border-ink-15 bg-white px-2.5 text-[11px] font-bold text-ink-70 hover:border-ink-30 disabled:opacity-50"
        >
          메모 저장
        </button>
      </div>

      <p className="mt-2 text-[10.5px] text-ink-50">
        {format(new Date(r.created_at), "yyyy-MM-dd HH:mm")} 요청
        {r.resolved_at ? ` · ${format(new Date(r.resolved_at), "yyyy-MM-dd HH:mm")} 완료` : ""}
      </p>
    </li>
  );
}
