"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction({ email, password }, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(result.next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3">
      <label className="block">
        <span className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-30">
          이메일
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-lg border border-ink-90 bg-ink-90/70 px-3.5 text-[14px] text-white outline-none transition-colors placeholder:text-ink-50 focus:border-iris-glow/60"
          placeholder="admin@studioboda.kr"
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
          className="h-11 w-full rounded-lg border border-ink-90 bg-ink-90/70 px-3.5 text-[14px] text-white outline-none transition-colors placeholder:text-ink-50 focus:border-iris-glow/60"
          placeholder="••••••••"
        />
      </label>

      {error ? (
        <p className="rounded-md border border-error/30 bg-error/[0.08] px-3 py-2 text-[12px] text-error">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-lg bg-iris font-display text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
