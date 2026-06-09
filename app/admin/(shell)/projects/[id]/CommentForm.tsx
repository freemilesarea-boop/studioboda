"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCommentAction } from "@/lib/actions/projects";
import { useToast } from "@/components/admin/Toast";

export function CommentForm({ projectId }: { projectId: string }) {
  const [body, setBody] = useState("");
  // 기본값 = 고객 공개. 운영자가 명시적으로 체크할 때만 내부 메모로 저장된다.
  const [isInternal, setIsInternal] = useState(false);
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
        push(isInternal ? "내부 메모를 저장했습니다" : "고객에게 메시지를 보냈습니다");
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
        placeholder={
          isInternal
            ? "내부 메모 (고객에게 보이지 않습니다)"
            : "고객에게 보낼 메시지를 입력하세요"
        }
        className="w-full resize-y rounded-md border border-ink-15 bg-white px-3 py-2 text-[13px] leading-[1.6] outline-none focus:border-iris/60"
      />
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[12px] text-ink-70">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="accent-iris"
          />
          내부 메모로만 저장
          {isInternal ? (
            <span className="font-bold text-warning">· 고객에게 보이지 않습니다</span>
          ) : null}
        </label>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className={`h-9 rounded-lg px-3.5 font-display text-[12.5px] font-bold text-white disabled:opacity-60 ${
            isInternal ? "bg-ink-70 hover:bg-ink-100" : "bg-iris hover:opacity-90"
          }`}
        >
          {pending ? "등록 중…" : isInternal ? "내부 메모 저장" : "고객에게 보내기"}
        </button>
      </div>
    </form>
  );
}
