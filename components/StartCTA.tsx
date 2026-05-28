"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserAuthSupabase } from "@/lib/supabase/browser";

type Variant =
  | "primary"
  | "cinematic"
  | "ghost-cinematic"
  | "white"
  | "dark"
  | "outline"
  | "subtle"
  | "ghost-light"
  | "ghost-dark";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[12px] rounded-lg",
  md: "h-10 px-5 text-[13px] rounded-lg",
  lg: "h-12 px-7 text-[15px] rounded-xl",
};

const variants: Record<Variant, string> = {
  primary: "bg-iris text-white hover:opacity-90",
  cinematic: "btn-primary-cinematic text-white",
  "ghost-cinematic": "btn-ghost-cinematic text-white",
  white: "bg-white text-iris hover:opacity-90",
  dark: "bg-ink-100 text-white hover:bg-ink-90",
  outline:
    "bg-white text-ink-70 border border-ink-15 hover:border-ink-30 hover:text-ink-100",
  subtle:
    "bg-ink-5 text-ink-100 border border-ink-15 hover:border-iris hover:text-iris",
  "ghost-light":
    "bg-white/[0.08] text-white border border-white/[0.12] hover:bg-white/[0.14]",
  "ghost-dark":
    "bg-transparent text-ink-70 hover:bg-ink-5 hover:text-ink-100",
};

const base =
  "group inline-flex items-center justify-center gap-2 font-display font-bold tracking-tight transition-[opacity,background,border,color,transform] duration-150 select-none active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:pointer-events-none";

type Props = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  /** Where to send the user when they are already logged in. Default: #inquiry */
  authedHref?: string;
  /** Override the signup destination. Default: /signup */
  guestHref?: string;
  /** Optional plan key passed to /signup as ?plan= */
  plan?: string;
  onNavigate?: () => void;
};

/**
 * Auth-aware CTA. Renders an instant Link (no layout shift) — the destination
 * is decided based on Supabase session at click time, so even before the
 * session is loaded we still navigate.
 */
export function StartCTA({
  variant = "primary",
  size = "md",
  className = "",
  children,
  authedHref = "#inquiry",
  guestHref = "/signup",
  plan,
  onNavigate,
}: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createBrowserAuthSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      setSignedIn(!!user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      setSignedIn(!!s?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Resolve href — when state not yet known, default to guest path so users
  // who are logged out (the common case) get the right destination instantly.
  const guest = plan ? `${guestHref}?plan=${encodeURIComponent(plan)}` : guestHref;
  const href = signedIn === true ? authedHref : guest;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      data-auth-state={signedIn === null ? "unknown" : signedIn ? "in" : "out"}
    >
      {children}
    </Link>
  );
}
