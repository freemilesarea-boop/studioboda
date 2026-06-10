"use client";

import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useRealtimeComments } from "@/hooks/useRealtimeComments";
import { markProjectReadStaffAction } from "@/lib/actions/project-workspace";
import type { ProjectComment } from "@/lib/types/db";

export function CommentsList({
  projectId,
  initial,
}: {
  projectId: string;
  initial: ProjectComment[];
}) {
  const comments = useRealtimeComments(projectId, initial);

  // 운영팀이 대화를 열람하면 읽음 기록 → 고객 화면에 "관리자 확인함" 노출.
  useEffect(() => {
    void markProjectReadStaffAction(projectId);
  }, [projectId, comments.length]);

  if (comments.length === 0) {
    return (
      <p className="py-4 text-[12.5px] text-ink-50">아직 코멘트가 없습니다.</p>
    );
  }

  return (
    <div className="divide-y divide-ink-15">
      {comments.map((c) => (
        <div key={c.id} className="py-3">
          <div className="flex items-center gap-2 text-[11px] text-ink-50">
            <span
              className={`rounded-full px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.08em] ${
                c.is_internal
                  ? "bg-warning/15 text-warning"
                  : "bg-iris/10 text-iris"
              }`}
            >
              {c.is_internal ? "내부" : "클라이언트"}
            </span>
            <span>
              {formatDistanceToNow(new Date(c.created_at), {
                locale: ko,
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-[1.65] text-ink-100">
            {c.body}
          </p>
        </div>
      ))}
    </div>
  );
}
