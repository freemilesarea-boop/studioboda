import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { getProfile } from "@/lib/auth";
import { listMyNotifications } from "@/lib/queries/notifications";
import { markAllNotificationsReadAction } from "@/lib/actions/notifications";
import { notificationMeta } from "@/lib/notifications/registry";
import type { Notification } from "@/lib/types/db";

async function markAllAction() {
  "use server";
  await markAllNotificationsReadAction();
}

export const metadata: Metadata = {
  title: "알림",
  robots: { index: false, follow: false },
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
  const meta = notificationMeta(n.type);
  const href = meta.hrefFor(n.payload);
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
            {meta.summary(n.payload)}
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
