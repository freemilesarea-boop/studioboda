"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  createWorkspaceUploadUrlAction,
  downloadProjectAttachmentAction,
  markProjectReadAction,
  sendChatMessageAction,
} from "@/lib/actions/project-workspace";
import type { RevisionAttachment } from "@/lib/types/db";
import type { ProjectComment } from "@/lib/queries/customer";
import { useToast } from "@/components/admin/Toast";
import { fmtSize, uploadToSignedUrl } from "./uploadClient";

const CHAT_MAX = 25 * 1024 * 1024;

export function ChatPanel({
  projectId,
  myUserId,
  messages,
}: {
  projectId: string;
  myUserId: string;
  messages: ProjectComment[];
}) {
  const [body, setBody] = useState("");
  const [attaching, setAttaching] = useState<RevisionAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  // Oldest → newest for a natural chat flow (query returns newest first).
  const ordered = [...messages].reverse();

  // Mark thread read whenever it opens or new messages arrive.
  useEffect(() => {
    void markProjectReadAction(projectId);
  }, [projectId, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function attach(file: File) {
    if (file.size > CHAT_MAX) {
      push("첨부는 25MB 이하만 가능합니다", "error");
      return;
    }
    setBusy(true);
    const urlRes = await createWorkspaceUploadUrlAction(projectId, "chat", file.name);
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
    setAttaching((a) => [
      ...a,
      { name: file.name, path: urlRes.path, size: file.size, type: file.type || null },
    ]);
    setBusy(false);
  }

  function send() {
    if (!body.trim() && attaching.length === 0) return;
    startTransition(async () => {
      const r = await sendChatMessageAction(projectId, body, attaching);
      if (r.ok) {
        setBody("");
        setAttaching([]);
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
    <div className="flex h-[60vh] min-h-[420px] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {ordered.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <i className="ti ti-messages text-[28px] text-ink-30" aria-hidden />
              <p className="mt-2 text-[12.5px] text-ink-50">
                운영팀과 바로 대화를 시작하세요.
              </p>
            </div>
          </div>
        ) : (
          ordered.map((m) => {
            const mine = m.author_id === myUserId;
            const atts = (Array.isArray(m.attachments) ? m.attachments : []) as RevisionAttachment[];
            const name = mine ? "나" : m.author?.name || m.author?.email || "STUDIO BODA";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <div className="mb-0.5 flex items-center gap-1.5 px-1 text-[10px] text-ink-50">
                    {!mine ? <span className="font-display font-bold text-ink-70">{name}</span> : null}
                    <span>{format(new Date(m.created_at), "MM/dd HH:mm")}</span>
                  </div>
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-[13px] leading-body ${
                      mine
                        ? "rounded-br-sm bg-iris text-white"
                        : "rounded-bl-sm bg-ink-5 text-ink-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    {atts.length > 0 ? (
                      <ul className="mt-1.5 space-y-1">
                        {atts.map((a, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onClick={() => downloadAtt(a)}
                              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-bold ${
                                mine ? "bg-white/15 hover:bg-white/25" : "bg-white hover:bg-ink-5 border border-ink-15"
                              }`}
                            >
                              <i className="ti ti-paperclip text-[13px]" aria-hidden />
                              <span className="max-w-[180px] truncate">{a.name}</span>
                              <span className={mine ? "text-white/70" : "text-ink-50"}>
                                {fmtSize(a.size)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="mt-3 border-t border-ink-15 pt-3">
        {attaching.length > 0 ? (
          <ul className="mb-2 flex flex-wrap gap-1.5">
            {attaching.map((a, i) => (
              <li
                key={i}
                className="inline-flex items-center gap-1.5 rounded-md border border-ink-15 bg-ink-5 px-2 py-1 text-[11px]"
              >
                <i className="ti ti-paperclip text-[12px] text-ink-50" aria-hidden />
                <span className="max-w-[140px] truncate">{a.name}</span>
                <button
                  type="button"
                  onClick={() => setAttaching((arr) => arr.filter((_, j) => j !== i))}
                  className="text-ink-50 hover:text-error"
                  aria-label="첨부 제거"
                >
                  <i className="ti ti-x text-[12px]" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex items-end gap-2">
          <label className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-ink-15 bg-white text-ink-50 hover:border-ink-30 hover:text-ink-100">
            <i className={`ti ${busy ? "ti-loader-2 animate-spin" : "ti-paperclip"} text-[16px]`} aria-hidden />
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
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="메시지를 입력하세요 (Enter 전송 · Shift+Enter 줄바꿈)"
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-ink-15 bg-white px-3 py-2.5 text-[13px] leading-body outline-none focus:border-iris/60"
          />
          <button
            type="button"
            onClick={send}
            disabled={pending || busy || (!body.trim() && attaching.length === 0)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-iris text-white hover:opacity-90 disabled:opacity-50"
            aria-label="전송"
          >
            <i className="ti ti-send text-[16px]" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
