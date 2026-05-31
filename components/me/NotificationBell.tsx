"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { notificationMeta } from "@/lib/notifications/registry";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import type { Notification } from "@/lib/types/db";

export function NotificationBell({
  initialItems,
  initialUnread,
}: {
  initialItems: Notification[];
  initialUnread: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>(initialItems);
  const [unread, setUnread] = useState<number>(initialUnread);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setUnread(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleMarkAll = useCallback(async () => {
    const now = new Date().toISOString();
    setUnread(0);
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: now })),
    );
    await markAllNotificationsReadAction();
    router.refresh();
  }, [router]);

  const handleRowClick = useCallback(
    async (n: Notification) => {
      const meta = notificationMeta(n.type);
      const href = meta.hrefFor(n.payload);
      if (!n.read_at) {
        setUnread((u) => Math.max(0, u - 1));
        setItems((prev) =>
          prev.map((it) =>
            it.id === n.id
              ? { ...it, read_at: new Date().toISOString() }
              : it,
          ),
        );
        await markNotificationReadAction(n.id);
      }
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const visible = items.slice(0, 5);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="알림"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-ink-15 bg-white text-ink-70 hover:border-ink-30 hover:text-ink-100"
      >
        <i className="ti ti-bell text-[16px]" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-iris px-1 text-[10px] font-display font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] rounded-xl border border-ink-15 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-ink-15 px-4 py-3">
            <p className="font-display text-[14px] font-extrabold text-ink-100">
              알림
            </p>
            <button
              type="button"
              onClick={handleMarkAll}
              className="font-display text-[12px] font-bold text-ink-50 hover:text-ink-100"
            >
              모두 읽음
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <i className="ti ti-bell text-[22px] text-ink-30" aria-hidden />
              <p className="mt-2 font-display text-[12.5px] font-semibold text-ink-70">
                새 알림이 없습니다
              </p>
            </div>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto py-1">
              {visible.map((n) => {
                const meta = notificationMeta(n.type);
                const isUnread = n.read_at == null;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleRowClick(n)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-ink-5"
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}
                      >
                        <i
                          className={`ti ${meta.icon} text-[15px]`}
                          aria-hidden
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-display text-[13px] font-bold text-ink-100">
                            {meta.label}
                          </p>
                          {isUnread ? (
                            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-iris" />
                          ) : null}
                        </div>
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
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-ink-15 px-4 py-2.5">
            <Link
              href="/me/notifications"
              onClick={() => setOpen(false)}
              className="block text-center font-display text-[12px] font-bold text-iris hover:underline"
            >
              전체 보기
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
