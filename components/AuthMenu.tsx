"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserAuthSupabase } from "@/lib/supabase/browser";
import { logoutAction } from "@/lib/actions/auth";

type Session = {
  email: string;
  name: string | null;
};

export function AuthMenu({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const supabase = createBrowserAuthSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (user) {
        const meta = (user.user_metadata ?? {}) as { name?: string };
        setSession({ email: user.email ?? "", name: meta.name ?? null });
      }
      setLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      if (s?.user) {
        const meta = (s.user.user_metadata ?? {}) as { name?: string };
        setSession({ email: s.user.email ?? "", name: meta.name ?? null });
      } else {
        setSession(null);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  function onLogout() {
    startTransition(async () => {
      await logoutAction();
      router.refresh();
    });
  }

  const isDark = variant === "dark";
  const linkBase = isDark
    ? "rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-ink-30 hover:text-white"
    : "rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink-70 hover:text-ink-100";
  const ctaBase = isDark
    ? "rounded-lg bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-ink-100 hover:opacity-90"
    : "rounded-lg bg-ink-100 px-3.5 py-1.5 text-[12.5px] font-bold text-white hover:bg-ink-90";

  if (!loaded) {
    return (
      <div className="hidden h-9 w-[140px] md:block" aria-hidden />
    );
  }

  if (!session) {
    return (
      <div className="hidden items-center gap-1 md:flex">
        <Link href="/login" className={linkBase}>
          로그인
        </Link>
        <Link href="/signup" className={ctaBase}>
          회원가입
        </Link>
      </div>
    );
  }

  const label = session.name || session.email.split("@")[0];

  return (
    <div className="hidden items-center gap-2 md:flex">
      <span
        className={`max-w-[160px] truncate font-display text-[12.5px] font-semibold ${
          isDark ? "text-white" : "text-ink-100"
        }`}
        title={session.email}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onLogout}
        disabled={pending}
        className={
          isDark
            ? "rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-white/[0.06] disabled:opacity-60"
            : "rounded-lg border border-ink-15 px-3 py-1.5 text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100 disabled:opacity-60"
        }
      >
        {pending ? "로그아웃 중…" : "로그아웃"}
      </button>
    </div>
  );
}

export function AuthMenuMobile({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const supabase = createBrowserAuthSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (user) {
        const meta = (user.user_metadata ?? {}) as { name?: string };
        setSession({ email: user.email ?? "", name: meta.name ?? null });
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  function onLogout() {
    startTransition(async () => {
      await logoutAction();
      onNavigate?.();
      router.refresh();
    });
  }

  if (!loaded) return null;

  if (!session) {
    return (
      <div className="mt-3 grid gap-2">
        <Link
          href="/login"
          onClick={onNavigate}
          className="grid h-11 place-items-center rounded-lg border border-ink-15 text-[14px] font-medium text-ink-70"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          onClick={onNavigate}
          className="grid h-11 place-items-center rounded-lg bg-ink-100 text-[14px] font-bold text-white"
        >
          회원가입
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      <p className="rounded-lg border border-ink-15 px-3 py-2 text-[13px] text-ink-70">
        {session.name || session.email}
      </p>
      <button
        type="button"
        onClick={onLogout}
        disabled={pending}
        className="grid h-11 place-items-center rounded-lg border border-ink-15 text-[14px] font-medium text-ink-70 disabled:opacity-60"
      >
        {pending ? "로그아웃 중…" : "로그아웃"}
      </button>
    </div>
  );
}
