"use client";

import { logoutAction } from "@/lib/actions/auth";

export function Topbar({
  title,
  userName,
  role,
}: {
  title: string;
  userName: string;
  role: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center gap-4 border-b border-ink-15 bg-white px-5 lg:px-8">
      <h1 className="font-display text-[16px] font-bold tracking-[-0.3px] text-ink-100">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="font-display text-[12px] font-semibold text-ink-100">
            {userName}
          </p>
          <p className="text-[10px] uppercase tracking-[0.08em] text-ink-50">
            {role}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-ink-15 px-3 py-1.5 font-display text-[12px] font-semibold text-ink-70 transition-colors hover:border-ink-30 hover:text-ink-100"
          >
            로그아웃
          </button>
        </form>
      </div>
    </header>
  );
}
