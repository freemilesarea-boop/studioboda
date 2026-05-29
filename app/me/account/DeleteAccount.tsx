"use client";

import { useState, useTransition } from "react";
import { deleteMyAccountAction } from "@/lib/actions/account";

const input =
  "h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-error/60";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErr(null);
    startTransition(async () => {
      const r = await deleteMyAccountAction(fd);
      if (!r.ok) setErr(r.error ?? "탈퇴 실패");
      // On success, the action redirects to "/" — no further UI work.
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center rounded-lg border border-error/40 bg-white px-4 font-display text-[13px] font-bold text-error hover:bg-error/[0.06]"
      >
        탈퇴 절차 시작
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-[13px] leading-[1.65] text-error/80">
        탈퇴를 진행하려면 아래 두 항목을 모두 입력해주세요. 확인 후 즉시 계정이 삭제되며 되돌릴 수 없습니다.
      </p>
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.08em] text-error">
          현재 비밀번호
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={input}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.08em] text-error">
          확인 문구
        </span>
        <input
          type="text"
          name="confirm_text"
          required
          placeholder='"탈퇴합니다" 입력'
          className={input}
        />
        <span className="mt-1 block text-[11px] text-error/70">
          정확히 <strong>탈퇴합니다</strong> 라고 입력해주세요.
        </span>
      </label>
      {err ? (
        <p className="text-[12.5px] font-semibold text-error">{err}</p>
      ) : null}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(false)}
          className="inline-flex h-10 items-center rounded-lg border border-ink-15 bg-white px-4 font-display text-[13px] font-bold text-ink-70 hover:border-ink-30 disabled:opacity-60"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-lg bg-error px-5 font-display text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "처리 중…" : "탈퇴 확정"}
        </button>
      </div>
    </form>
  );
}
