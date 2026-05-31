import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { getProfile } from "@/lib/auth";
import { listMyNotifications } from "@/lib/queries/notifications";
import { markAllNotificationsReadAction } from "@/lib/actions/notifications";
import type { Notification } from "@/lib/types/db";

async function markAllAction() {
  "use server";
  await markAllNotificationsReadAction();
}

export const metadata: Metadata = {
  title: "알림",
  robots: { index: false, follow: false },
};

const TYPE_META: Record<
  string,
  { icon: string; tone: string; label: string; hrefFor?: (p: Record<string, unknown>) => string | null }
> = {
  welcome: {
    icon: "ti-sparkles",
    tone: "bg-iris/15 text-iris",
    label: "환영합니다",
    hrefFor: () => "/me",
  },
  quote_received: {
    icon: "ti-file-invoice",
    tone: "bg-iris/15 text-iris",
    label: "새 견적",
    hrefFor: (p) =>
      typeof p.quote_id === "string" ? `/me/quotes/${p.quote_id}` : "/me/quotes",
  },
  payment_requested: {
    icon: "ti-credit-card",
    tone: "bg-warning/15 text-warning",
    label: "결제 요청",
    hrefFor: () => "/me/payments",
  },
  payment_paid: {
    icon: "ti-circle-check",
    tone: "bg-success/15 text-success",
    label: "결제 완료",
    hrefFor: () => "/me/payments",
  },
  payment_failed: {
    icon: "ti-alert-triangle",
    tone: "bg-error/15 text-error",
    label: "결제 실패",
    hrefFor: () => "/me/payments",
  },
  project_started: {
    icon: "ti-rocket",
    tone: "bg-iris/15 text-iris",
    label: "프로젝트 시작",
    hrefFor: (p) =>
      typeof p.project_id === "string"
        ? `/me/projects/${p.project_id}`
        : "/me/projects",
  },
  project_delivered: {
    icon: "ti-package",
    tone: "bg-success/15 text-success",
    label: "최종 전달",
    hrefFor: (p) =>
      typeof p.project_id === "string"
        ? `/me/projects/${p.project_id}`
        : "/me/projects",
  },
  project_completed: {
    icon: "ti-flag-check",
    tone: "bg-success/15 text-success",
    label: "프로젝트 완료",
    hrefFor: (p) =>
      typeof p.project_id === "string"
        ? `/me/projects/${p.project_id}`
        : "/me/projects",
  },
  file_uploaded: {
    icon: "ti-file-upload",
    tone: "bg-sky/15 text-sky",
    label: "파일 업로드",
    hrefFor: (p) =>
      typeof p.project_id === "string"
        ? `/me/projects/${p.project_id}`
        : "/me/projects",
  },
  revision_requested: {
    icon: "ti-pencil",
    tone: "bg-warning/15 text-warning",
    label: "수정 요청",
    hrefFor: (p) =>
      typeof p.project_id === "string"
        ? `/me/projects/${p.project_id}`
        : "/me/projects",
  },
  comment_posted: {
    icon: "ti-messages",
    tone: "bg-ink-5 text-ink-70",
    label: "메시지",
    hrefFor: (p) =>
      typeof p.project_id === "string"
        ? `/me/projects/${p.project_id}`
        : "/me/projects",
  },
  tax_document_requested: {
    icon: "ti-receipt",
    tone: "bg-warning/15 text-warning",
    label: "증빙 발행 요청",
    hrefFor: () => "/me/payments",
  },
  tax_document_issued: {
    icon: "ti-receipt-2",
    tone: "bg-success/15 text-success",
    label: "증빙 발행 완료",
    hrefFor: () => "/me/payments",
  },
  contract_sent: {
    icon: "ti-file-text",
    tone: "bg-iris/15 text-iris",
    label: "계약서 도착",
    hrefFor: (p) =>
      typeof p.contract_id === "string"
        ? `/me/contracts/${p.contract_id}`
        : "/me/contracts",
  },
  contract_signed: {
    icon: "ti-file-check",
    tone: "bg-success/15 text-success",
    label: "계약 체결 완료",
    hrefFor: (p) =>
      typeof p.contract_id === "string"
        ? `/me/contracts/${p.contract_id}`
        : "/me/contracts",
  },
  quote_package_sent: {
    icon: "ti-mail-fast",
    tone: "bg-iris/15 text-iris",
    label: "견적서·계약서·예약금 안내",
    hrefFor: (p) =>
      typeof p.contract_id === "string"
        ? `/me/contracts/${p.contract_id}`
        : "/me/contracts",
  },
};

const fallback = {
  icon: "ti-bell",
  tone: "bg-ink-5 text-ink-70",
  label: "알림",
  hrefFor: () => "/me",
};

export default async function MyNotificationsPage() {
  const me = await getProfile();
  if (!me) return null;
  const items = await listMyNotifications(me.id, 100);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
            Notifications
          </p>
          <h1 className="mt-1 font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
            알림{" "}
            <span className="num ml-1.5 text-[13px] font-bold text-ink-50">
              {items.length}
            </span>
          </h1>
        </div>
        <form action={markAllAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-lg border border-ink-15 bg-white px-3.5 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
          >
            모두 읽음 처리
          </button>
        </form>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-12 text-center">
          <i className="ti ti-bell text-[26px] text-ink-30" aria-hidden />
          <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
            아직 알림이 없습니다
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const meta = TYPE_META[n.type] ?? fallback;
  const href = meta.hrefFor?.(n.payload) ?? "/me";
  const unread = !n.read_at;
  return (
    <li>
      <Link
        href={href}
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition-colors ${
          unread
            ? "border-iris/30 bg-iris-light/40 hover:bg-iris-light"
            : "border-ink-15 bg-white hover:border-ink-30"
        }`}
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}
        >
          <i className={`ti ${meta.icon} text-[15px]`} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-[13px] font-bold text-ink-100">
              {meta.label}
            </p>
            {unread ? (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-iris" />
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-1 text-[12.5px] text-ink-70">
            {summary(n)}
          </p>
          <p className="mt-1 text-[10.5px] text-ink-50">
            {formatDistanceToNow(new Date(n.created_at), {
              locale: ko,
              addSuffix: true,
            })}
          </p>
        </div>
      </Link>
    </li>
  );
}

function summary(n: Notification): string {
  const p = n.payload;
  const title = typeof p?.title === "string" ? p.title : undefined;
  const amount = typeof p?.amount === "number" ? p.amount : undefined;
  switch (n.type) {
    case "welcome":
      return "STUDIO BODA에 오신 것을 환영합니다";
    case "quote_received":
      return title
        ? `견적: ${title}`
        : "새 견적이 발행되었습니다";
    case "payment_requested":
      return title && amount
        ? `${title} · ${new Intl.NumberFormat("ko-KR").format(amount)}원`
        : "결제 요청이 도착했습니다";
    case "payment_paid":
      return title && amount
        ? `${title} · ${new Intl.NumberFormat("ko-KR").format(amount)}원 결제 완료`
        : "결제가 완료되었습니다";
    case "project_started":
      return title ? `${title} · 작업 시작` : "프로젝트가 시작되었습니다";
    case "project_delivered":
      return title ? `${title} · 최종 전달 완료` : "산출물이 전달되었습니다";
    case "project_completed":
      return "프로젝트가 완료되었습니다";
    case "file_uploaded":
      return "운영팀이 새 파일을 공유했습니다";
    case "revision_requested":
      return "고객이 수정 요청을 보냈습니다";
    case "comment_posted":
      return "새 메시지가 도착했습니다";
    case "tax_document_requested":
      return title ? `${title} · 증빙 발행 요청` : "증빙 발행 요청이 접수되었습니다";
    case "tax_document_issued":
      return title ? `${title} · 증빙 발행 완료` : "증빙이 발행되었습니다";
    case "contract_sent":
      return "검토하고 서명할 계약서가 도착했습니다";
    case "contract_signed":
      return "계약이 체결되었습니다";
    case "quote_package_sent":
      return "견적서 확인 → 계약서 서명 → 예약금 결제 순으로 진행해주세요";
    default:
      return "새 알림이 있습니다";
  }
}
