"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePasswordAction } from "@/lib/actions/auth";

export function ResetForm() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw !== pw2) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }
    startTransition(async () => {
      const r = await updatePasswordAction(pw);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.replace("/me");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-caption text-ink-30">
          새 비밀번호 (8자 이상)
        </span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-[13.5px] text-white outline-none placeholder:text-ink-50 focus:border-iris-glow/60"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-caption text-ink-30">
          비밀번호 확인
        </span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-[13.5px] text-white outline-none placeholder:text-ink-50 focus:border-iris-glow/60"
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
        {pending ? "변경 중…" : "비밀번호 변경 →"}
      </button>
    </form>
  );
}
