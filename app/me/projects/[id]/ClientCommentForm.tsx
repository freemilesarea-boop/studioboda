"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postMyCommentAction } from "@/lib/actions/customer";
import { useToast } from "@/components/admin/Toast";

type Mode = "comment" | "revision";

export function ClientCommentForm({ projectId }: { projectId: string }) {
  const [mode, setMode] = useState<Mode>("comment");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      push("내용을 입력해주세요", "error");
      return;
    }
    startTransition(async () => {
      const r = await postMyCommentAction(
        projectId,
        body,
        mode === "revision",
      );
      if (r.ok) {
        push(
          mode === "revision"
            ? "수정 요청이 전달되었습니다"
            : "메시지가 전달되었습니다",
        );
        setBody("");
        router.refresh();
      } else {
        push((r as { error?: string }).error ?? "전송 실패", "error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setMode("comment")}
          className={`rounded-lg border px-3 py-1.5 font-display text-[11.5px] font-bold transition-colors ${
            mode === "comment"
              ? "border-iris bg-iris text-white"
              : "border-ink-15 bg-white text-ink-70 hover:border-ink-30 hover:text-ink-100"
          }`}
        >
          메시지
        </button>
        <button
          type="button"
          onClick={() => setMode("revision")}
          className={`rounded-lg border px-3 py-1.5 font-display text-[11.5px] font-bold transition-colors ${
            mode === "revision"
              ? "border-warning bg-warning text-white"
              : "border-ink-15 bg-white text-ink-70 hover:border-warning hover:text-warning"
          }`}
        >
          수정 요청
        </button>
        {mode === "revision" ? (
          <span className="text-[11px] text-ink-50">
            · 운영팀이 즉시 우선 큐로 처리합니다
          </span>
        ) : null}
      </div>

      <textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        placeholder={
          mode === "revision"
            ? "예: 1번 카드의 제목 톤을 좀 더 부드럽게, 2번은 컬러 대비 강하게."
            : "운영팀에게 전달할 내용을 적어주세요."
        }
        className="w-full resize-y rounded-md border border-ink-15 bg-white px-3 py-2.5 text-[13px] leading-body outline-none focus:border-iris/60"
      />

      <div className="flex items-center justify-between">
        <span className="text-[10.5px] text-ink-50">{body.length}/2000</span>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className={`inline-flex h-10 items-center rounded-lg px-4 font-display text-[12.5px] font-bold text-white disabled:opacity-60 ${
            mode === "revision" ? "bg-warning hover:opacity-90" : "bg-ink-100 hover:bg-ink-90"
          }`}
        >
          {pending
            ? "전송 중…"
            : mode === "revision"
            ? "수정 요청 보내기 →"
            : "메시지 보내기 →"}
        </button>
      </div>
    </form>
  );
}
