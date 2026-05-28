"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserAuthSupabase } from "@/lib/supabase/browser";

export function MobileCTA() {
  const [visible, setVisible] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > 480 && y < max - 720);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = createBrowserAuthSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (active) setSignedIn(!!user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (active) setSignedIn(!!s?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const href = signedIn ? "#inquiry" : "/signup";
  const label = signedIn ? "무료 견적 받기 · 24h 회신" : "회원가입하고 시작하기";

  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 transition-[transform,opacity] duration-300 md:hidden ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
    >
      <Link
        href={href}
        className="pointer-events-auto group flex h-12 w-full max-w-[440px] items-center justify-between gap-3 rounded-full bg-ink-100 pl-5 pr-2 text-white"
      >
        <span className="flex items-center gap-2">
          <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center text-success live-ring">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          <span className="text-[13px] font-bold">{label}</span>
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-iris text-[13px] transition-transform duration-150 group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </div>
  );
}
