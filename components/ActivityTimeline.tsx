import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { ActivityLog } from "@/lib/types/db";

type Action =
  | "created"
  | "status_changed"
  | "sent"
  | "accepted"
  | "customer_accepted"
  | "customer_rejected"
  | "progress_changed"
  | "priority_changed"
  | "comment_added"
  | "comment_posted"
  | "client_comment_posted"
  | "revision_requested"
  | "file_uploaded"
  | "file_deleted"
  | "file_downloaded"
  | "webhook_paid"
  | "webhook_failed"
  | "webhook_cancelled"
  | "signed_up";

const ACTION_META: Partial<Record<Action, { icon: string; tone: string; label: string }>> = {
  created: { icon: "ti-plus", tone: "bg-iris/15 text-iris", label: "생성" },
  status_changed: { icon: "ti-flag", tone: "bg-sky/15 text-sky", label: "상태 변경" },
  sent: { icon: "ti-send", tone: "bg-iris/15 text-iris", label: "발송" },
  accepted: { icon: "ti-circle-check", tone: "bg-success/15 text-success", label: "수락" },
  customer_accepted: { icon: "ti-circle-check", tone: "bg-success/15 text-success", label: "고객 수락" },
  customer_rejected: { icon: "ti-x", tone: "bg-error/15 text-error", label: "고객 거절" },
  progress_changed: { icon: "ti-progress", tone: "bg-sky/15 text-sky", label: "진행률" },
  priority_changed: { icon: "ti-flag-3", tone: "bg-warning/15 text-warning", label: "우선순위" },
  comment_added: { icon: "ti-messages", tone: "bg-ink-5 text-ink-70", label: "운영팀 메모" },
  comment_posted: { icon: "ti-messages", tone: "bg-sky/15 text-sky", label: "고객 메시지" },
  client_comment_posted: { icon: "ti-messages", tone: "bg-sky/15 text-sky", label: "고객 메시지" },
  revision_requested: { icon: "ti-pencil", tone: "bg-warning/15 text-warning", label: "수정 요청" },
  file_uploaded: { icon: "ti-file-upload", tone: "bg-sky/15 text-sky", label: "파일 업로드" },
  file_deleted: { icon: "ti-trash", tone: "bg-error/15 text-error", label: "파일 삭제" },
  file_downloaded: { icon: "ti-download", tone: "bg-ink-5 text-ink-70", label: "파일 다운로드" },
  webhook_paid: { icon: "ti-credit-card", tone: "bg-success/15 text-success", label: "결제 완료" },
  webhook_failed: { icon: "ti-alert-triangle", tone: "bg-error/15 text-error", label: "결제 실패" },
  webhook_cancelled: { icon: "ti-x", tone: "bg-ink-5 text-ink-70", label: "결제 취소" },
};
const fallback = { icon: "ti-activity", tone: "bg-ink-5 text-ink-70", label: "이벤트" };

export async function ActivityTimeline({
  entityType,
  entityId,
  limit = 30,
  showRawAction = false,
}: {
  entityType: string;
  entityId: string;
  limit?: number;
  showRawAction?: boolean;
}) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("activity_logs")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);
  const items = (data ?? []) as ActivityLog[];

  if (items.length === 0) {
    return (
      <p className="text-[12.5px] text-ink-50">
        아직 기록된 활동이 없습니다.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((a) => {
        const meta = ACTION_META[a.action as Action] ?? fallback;
        return (
          <li key={a.id} className="flex items-start gap-3">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${meta.tone}`}
            >
              <i className={`ti ${meta.icon} text-[14px]`} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[12.5px] font-bold text-ink-100">
                {meta.label}
                {showRawAction ? (
                  <span className="ml-2 font-mono text-[10px] font-normal text-ink-50">
                    {a.action}
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-50">
                {formatDistanceToNow(new Date(a.created_at), {
                  locale: ko,
                  addSuffix: true,
                })}{" "}
                · {format(new Date(a.created_at), "yyyy-MM-dd HH:mm")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
