"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publicLoginAction } from "@/lib/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await publicLoginAction({ identifier, password }, next);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.replace(r.next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-30">
          이메일 또는 아이디
        </span>
        <input
          type="text"
          required
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-[13.5px] text-white outline-none transition-colors placeholder:text-ink-50 focus:border-iris-glow/60"
          placeholder="you@brand.kr 또는 username"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-30">
          비밀번호
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-[13.5px] text-white outline-none transition-colors placeholder:text-ink-50 focus:border-iris-glow/60"
          placeholder="••••••••"
        />
      </label>

      {error ? (
        <p className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-[12px] text-error">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-lg bg-white font-display text-[13px] font-bold text-ink-100 transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "로그인 중…" : "로그인 →"}
      </button>

      <p className="pt-1 text-right text-[11.5px]">
        <a
          href="/forgot-password"
          className="text-ink-30 hover:text-iris-glow"
        >
          비밀번호를 잊으셨나요?
        </a>
      </p>
    </form>
  );
}
