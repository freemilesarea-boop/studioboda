"use client";

import { useState, useTransition } from "react";
import { requestPasswordResetAction } from "@/lib/actions/auth";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await requestPasswordResetAction(email);
      if (r.ok) setDone(true);
      else setError(r.error);
    });
  }

  if (done) {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 px-4 py-4 text-[13px] text-success">
        <p className="font-display font-bold">메일이 발송되었습니다.</p>
        <p className="mt-1.5 text-[12px] text-ink-30">
          {email}로 비밀번호 재설정 링크를 보내드렸습니다. 메일함을 확인해주세요.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-caption text-ink-30">
          이메일
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-[13.5px] text-white outline-none placeholder:text-ink-50 focus:border-iris-glow/60"
          placeholder="you@brand.kr"
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
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-white font-display text-[13px] font-bold text-ink-100 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "메일 발송 중…" : "재설정 메일 받기 →"}
      </button>
    </form>
  );
}
