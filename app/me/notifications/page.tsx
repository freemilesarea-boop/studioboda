import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { getProfile } from "@/lib/auth";
import { listMyNotifications } from "@/lib/queries/notifications";
import { markAllNotificationsReadAction } from "@/lib/actions/notifications";
import {
  notificationMeta,
  notificationCategory,
  NOTIFICATION_CATEGORY_LABELS,
} from "@/lib/notifications/registry";
import type { Notification } from "@/lib/types/db";

async function markAllAction() {
  "use server";
  await markAllNotificationsReadAction();
}

export const metadata: Metadata = {
  title: "알림",
  robots: { index: false, follow: false },
};

type Filter = "all" | "unread" | "payment" | "project" | "contract";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "unread", label: "미읽음" },
  { key: "payment", label: "결제" },
  { key: "project", label: "프로젝트" },
  { key: "contract", label: "계약" },
];

const CAT_CHIP: Record<string, string> = {
  payment: "bg-iris/10 text-iris",
  project: "bg-sky/10 text-sky",
  contract: "bg-warning/10 text-warning",
  system: "bg-ink-5 text-ink-50",
};

const isActionableUnread = (n: Notification) =>
  notificationMeta(n.type).actionable && !n.read_at;

export default async function MyNotificationsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const me = await getProfile();
  if (!me) return null;
  const items = await listMyNotifications(me.id, 100);

  const filter: Filter =
    FILTERS.some((f) => f.key === searchParams.filter)
      ? (searchParams.filter as Filter)
      : "all";

  // Counts for the filter tabs.
  const unreadCount = items.filter((n) => !n.read_at).length;
  const catCount = (c: Filter) =>
    items.filter((n) => notificationCategory(n.type) === c).length;
  const counts: Record<Filter, number> = {
    all: items.length,
    unread: unreadCount,
    payment: catCount("payment"),
    project: catCount("project"),
    contract: catCount("contract"),
  };

  const filtered = items.filter((n) => {
    if (filter === "unread") return !n.read_at;
    if (filter === "payment" || filter === "project" || filter === "contract") {
      return notificationCategory(n.type) === filter;
    }
    return true;
  });

  // 행동 필요(미읽음 actionable)를 맨 위로, 그 외 최신순.
  const sorted = [...filtered].sort((a, b) => {
    const aw = isActionableUnread(a) ? 1 : 0;
    const bw = isActionableUnread(b) ? 1 : 0;
    if (aw !== bw) return bw - aw;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const actionableCount = items.filter(isActionableUnread).length;

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
        <div className="flex items-center gap-2">
          <Link
            href="/me/notifications/settings"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-15 bg-white px-3.5 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
          >
            <i className="ti ti-settings text-[14px]" aria-hidden />
            수신 설정
          </Link>
          <form action={markAllAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-lg border border-ink-15 bg-white px-3.5 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
            >
              모두 읽음 처리
            </button>
          </form>
        </div>
      </header>

      {/* 행동 필요 안내 */}
      {actionableCount > 0 ? (
        <div className="rounded-xl border border-warning/40 bg-warning/[0.06] px-4 py-2.5 text-[12.5px] font-bold text-warning">
          ⚠️ 확인이 필요한 알림이 {actionableCount}건 있습니다.
        </div>
      ) : null}

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/me/notifications" : `/me/notifications?filter=${f.key}`}
            className={`rounded-full border px-3 py-1.5 font-display text-[11.5px] font-semibold ${
              filter === f.key
                ? "border-ink-100 bg-ink-100 text-white"
                : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
            }`}
          >
            {f.label}
            {counts[f.key] > 0 ? (
              <span
                className={`num ml-1.5 ${filter === f.key ? "text-white/70" : "text-ink-50"}`}
              >
                {counts[f.key]}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-12 text-center">
          <i className="ti ti-bell text-[26px] text-ink-30" aria-hidden />
          <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
            {filter === "all" ? "아직 알림이 없습니다" : "해당 알림이 없습니다"}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const meta = notificationMeta(n.type);
  const href = meta.hrefFor(n.payload);
  const unread = !n.read_at;
  const category = notificationCategory(n.type);
  const needsAction = meta.actionable && unread;

  return (
    <li>
      <Link
        href={href}
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition-colors ${
          needsAction
            ? "border-warning/50 bg-warning/[0.06] hover:bg-warning/[0.1]"
            : unread
              ? "border-iris/30 bg-iris-light/40 hover:bg-iris-light"
              : "border-ink-15 bg-white hover:border-ink-30"
        }`}
      >
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}>
          <i className={`ti ${meta.icon} text-[15px]`} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-display text-[13px] font-bold text-ink-100">{meta.label}</p>
            <span
              className={`rounded-full px-1.5 py-0.5 font-display text-[9.5px] font-bold ${CAT_CHIP[category]}`}
            >
              {NOTIFICATION_CATEGORY_LABELS[category]}
            </span>
            {needsAction ? (
              <span className="rounded-full bg-warning px-1.5 py-0.5 font-display text-[9.5px] font-bold text-white">
                행동 필요
              </span>
            ) : unread ? (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-iris" />
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-1 text-[12.5px] text-ink-70">
            {meta.summary(n.payload)}
          </p>
          <p className="mt-1 text-[10.5px] text-ink-50">
            {formatDistanceToNow(new Date(n.created_at), { locale: ko, addSuffix: true })}
            {needsAction ? <span className="ml-1 font-bold text-warning">· 확인하기 →</span> : null}
          </p>
        </div>
      </Link>
    </li>
  );
}
