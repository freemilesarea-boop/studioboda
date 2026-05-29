"use client";

import { useState, useTransition } from "react";
import { changeMyPasswordAction } from "@/lib/actions/account";

const input =
  "h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60";

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(
    null,
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const r = await changeMyPasswordAction(fd);
      if (r.ok) {
        setMsg({ tone: "ok", text: "비밀번호가 변경되었습니다" });
        (e.target as HTMLFormElement).reset();
      } else {
        setMsg({ tone: "err", text: r.error ?? "변경 실패" });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="현재 비밀번호">
          <input
            type="password"
            name="current_password"
            required
            autoComplete="current-password"
            className={input}
          />
        </Field>
        <Field label="새 비밀번호 (8자 이상)">
          <input
            type="password"
            name="new_password"
            required
            minLength={8}
            autoComplete="new-password"
            className={input}
          />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-ink-15 pt-4">
        <p
          aria-live="polite"
          className={`text-[12.5px] font-semibold ${
            msg?.tone === "ok"
              ? "text-success"
              : msg?.tone === "err"
              ? "text-error"
              : "text-transparent"
          }`}
        >
          {msg?.text ?? "."}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-lg bg-ink-100 px-5 font-display text-[13px] font-bold text-white hover:bg-ink-90 disabled:opacity-60"
        >
          {pending ? "변경 중…" : "비밀번호 변경"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </span>
      {children}
    </label>
  );
}
