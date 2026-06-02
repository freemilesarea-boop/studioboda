"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  createRevisionAction,
  createWorkspaceUploadUrlAction,
  downloadProjectAttachmentAction,
} from "@/lib/actions/project-workspace";
import {
  revisionPriorityLabels,
  revisionStatusLabels,
  type RevisionAttachment,
  type RevisionPriority,
  type RevisionRequest,
  type RevisionStatus,
} from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";
import { fmtSize, uploadToSignedUrl } from "./uploadClient";

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
const STATUS_FLOW: RevisionStatus[] = ["requested", "reviewing", "in_progress", "done"];

export function RevisionsPanel({
  projectId,
  requests,
}: {
  projectId: string;
  requests: RevisionRequest[];
}) {
  const [open, setOpen] = useState(requests.length === 0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<RevisionPriority>("normal");
  const [atts, setAtts] = useState<RevisionAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  async function attach(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      push("첨부는 50MB 이하만 가능합니다", "error");
      return;
    }
    setBusy(true);
    const urlRes = await createWorkspaceUploadUrlAction(projectId, "revision", file.name);
    if (!urlRes.ok) {
      push(urlRes.error, "error");
      setBusy(false);
      return;
    }
    const up = await uploadToSignedUrl(urlRes.path, urlRes.token, file);
    if (!up.ok) {
      push(up.error, "error");
      setBusy(false);
      return;
    }
    setAtts((a) => [...a, { name: file.name, path: urlRes.path, size: file.size, type: file.type || null }]);
    setBusy(false);
  }

  function submit() {
    if (!title.trim() || !content.trim()) {
      push("제목과 내용을 입력해주세요", "error");
      return;
    }
    startTransition(async () => {
      const r = await createRevisionAction(projectId, { title, content, priority, attachments: atts });
      if (r.ok) {
        push("수정 요청이 접수되었습니다", "success");
        setTitle("");
        setContent("");
        setPriority("normal");
        setAtts([]);
        setOpen(false);
        router.refresh();
      } else push(r.error ?? "전송 실패", "error");
    });
  }

  function downloadAtt(a: RevisionAttachment) {
    startTransition(async () => {
      const r = await downloadProjectAttachmentAction(projectId, a.path, a.name);
      if (r.ok) window.open(r.url, "_blank", "noopener");
      else push(r.error ?? "다운로드 실패", "error");
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-ink-50">
          수정 요청은 채팅과 별도로 우선 처리되며, 이력은 보존됩니다.
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-warning px-3 font-display text-[12px] font-bold text-white hover:opacity-90"
        >
          <i className={`ti ${open ? "ti-x" : "ti-plus"} text-[14px]`} aria-hidden />
          {open ? "닫기" : "새 수정 요청"}
        </button>
      </div>

      {open ? (
        <div className="space-y-3 rounded-xl border border-warning/30 bg-warning/[0.04] p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="제목 (예: 메인 배너 카피 수정)"
            className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-warning/60"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="수정이 필요한 내용을 구체적으로 적어주세요."
            className="w-full resize-y rounded-md border border-ink-15 bg-white px-3 py-2.5 text-[13px] leading-body outline-none focus:border-warning/60"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11.5px] font-display font-bold text-ink-70">우선순위</span>
              {(["low", "normal", "high"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-md border px-2.5 py-1 text-[11.5px] font-bold ${
                    priority === p
                      ? "border-warning bg-warning text-white"
                      : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
                  }`}
                >
                  {revisionPriorityLabels[p]}
                </button>
              ))}
            </div>
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-ink-15 bg-white px-2.5 text-[11.5px] font-bold text-ink-70 hover:border-ink-30">
              <i className={`ti ${busy ? "ti-loader-2 animate-spin" : "ti-paperclip"} text-[13px]`} aria-hidden />
              파일 첨부
              <input
                type="file"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  if (e.target.files?.[0]) void attach(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {atts.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {atts.map((a, i) => (
                <li key={i} className="inline-flex items-center gap-1.5 rounded-md border border-ink-15 bg-white px-2 py-1 text-[11px]">
                  <i className="ti ti-paperclip text-[12px] text-ink-50" aria-hidden />
                  <span className="max-w-[140px] truncate">{a.name}</span>
                  <button type="button" onClick={() => setAtts((arr) => arr.filter((_, j) => j !== i))} className="text-ink-50 hover:text-error">
                    <i className="ti ti-x text-[12px]" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={pending || busy}
              className="inline-flex h-10 items-center rounded-lg bg-warning px-5 font-display text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "전송 중…" : "수정 요청 보내기 →"}
            </button>
          </div>
        </div>
      ) : null}

      {requests.length === 0 ? (
        <p className="text-[12.5px] text-ink-50">아직 수정 요청이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const stepIdx = STATUS_FLOW.indexOf(r.status);
            return (
              <li key={r.id} className="rounded-xl border border-ink-15 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption ${STATUS_TONE[r.status]}`}>
                    {revisionStatusLabels[r.status]}
                  </span>
                  <h4 className="font-display text-[13.5px] font-bold text-ink-100">{r.title}</h4>
                  <span className={`ml-auto text-[11px] font-bold ${PRIORITY_TONE[r.priority]}`}>
                    우선순위 {revisionPriorityLabels[r.priority]}
                  </span>
                </div>

                {/* status flow */}
                <ol className="mt-3 flex items-center gap-1">
                  {STATUS_FLOW.map((s, i) => (
                    <li key={s} className="flex flex-1 items-center gap-1">
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                          i <= stepIdx ? "bg-warning text-white" : "bg-ink-5 text-ink-50"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className={`text-[10px] ${i <= stepIdx ? "text-ink-100" : "text-ink-50"}`}>
                        {revisionStatusLabels[s]}
                      </span>
                      {i < STATUS_FLOW.length - 1 ? (
                        <span className={`h-px flex-1 ${i < stepIdx ? "bg-warning" : "bg-ink-15"}`} />
                      ) : null}
                    </li>
                  ))}
                </ol>

                <p className="mt-3 whitespace-pre-wrap text-[12.5px] leading-body text-ink-70">{r.content}</p>

                {r.attachments?.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {r.attachments.map((a, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => downloadAtt(a)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-ink-15 bg-ink-5 px-2 py-1 text-[11px] font-bold text-ink-70 hover:border-iris hover:text-iris"
                        >
                          <i className="ti ti-paperclip text-[12px]" aria-hidden />
                          <span className="max-w-[160px] truncate">{a.name}</span>
                          <span className="text-ink-50">{fmtSize(a.size)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {r.admin_note ? (
                  <div className="mt-3 rounded-lg bg-ink-5 px-3 py-2 text-[12px] text-ink-70">
                    <span className="font-display font-bold text-ink-100">운영팀 메모 · </span>
                    {r.admin_note}
                  </div>
                ) : null}

                <p className="mt-2 text-[10.5px] text-ink-50">
                  {format(new Date(r.created_at), "yyyy-MM-dd HH:mm")} 요청
                  {r.resolved_at ? ` · ${format(new Date(r.resolved_at), "yyyy-MM-dd HH:mm")} 완료` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
