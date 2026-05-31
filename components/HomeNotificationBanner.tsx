import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { getProfile } from "@/lib/auth";
import { actionableNotifications } from "@/lib/queries/notifications";
import { notificationMeta, isActionable } from "@/lib/notifications/registry";
import type { Notification } from "@/lib/types/db";

export async function HomeNotificationBanner() {
  let items: Notification[] = [];

  try {
    const me = await getProfile();
    if (!me) return null;
    const recent = await actionableNotifications(me.id, 4);
    items = recent.filter((n) => isActionable(n.type)).slice(0, 4);
  } catch {
    return null;
  }

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1100px] px-5 py-4 sm:px-8 lg:px-12">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-[15px] font-extrabold tracking-tightish text-ink-100">
          진행 중인 내 작업
        </h2>
        <Link
          href="/me"
          className="font-display text-[12px] font-bold text-iris hover:underline"
        >
          마이페이지에서 모두 보기
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((n) => {
          const meta = notificationMeta(n.type);
          return (
            <Link
              key={n.id}
              href={meta.hrefFor(n.payload)}
              className="flex items-start gap-3 rounded-2xl border border-ink-15 bg-white p-4 transition-colors hover:border-ink-30"
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}
              >
                <i className={`ti ${meta.icon} text-[15px]`} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[13px] font-bold text-ink-100">
                  {meta.label}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-70">
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
          );
        })}
      </div>
    </section>
  );
}
