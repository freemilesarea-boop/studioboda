"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCommentAction } from "@/lib/actions/projects";
import { useToast } from "@/components/admin/Toast";

export function CommentForm({ projectId }: { projectId: string }) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const r = await addCommentAction(projectId, body, isInternal);
      if (r.ok) {
        setBody("");
        push("코멘트가 등록되었습니다");
        router.refresh();
      } else {
        push(r.error ?? "등록 실패", "error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="진행 상황·내부 메모를 남기세요"
        className="w-full resize-y rounded-md border border-ink-15 bg-white px-3 py-2 text-[13px] leading-[1.6] outline-none focus:border-iris/60"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-[12px] text-ink-70">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="accent-iris"
          />
          내부 전용 메모
        </label>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="h-9 rounded-lg bg-ink-100 px-3.5 font-display text-[12.5px] font-bold text-white hover:bg-ink-90 disabled:opacity-60"
        >
          {pending ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
}
