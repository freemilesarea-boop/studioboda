"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMySubscriptionAction } from "@/lib/actions/subscriptions";

export function CancelSubscriptionForm({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("id", subscriptionId);
    setErr(null);
    startTransition(async () => {
      const r = await cancelMySubscriptionAction(fd);
      if (!r.ok) {
        setErr(r.error ?? "해지 실패");
        return;
      }
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center rounded-lg border border-error/40 bg-white px-4 font-display text-[13px] font-bold text-error hover:bg-error/[0.06]"
      >
        구독 해지하기
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.08em] text-error">
          해지 사유 (선택)
        </span>
        <textarea
          name="reason"
          rows={3}
          placeholder="개선이 필요한 부분을 알려주시면 다음 운영에 반영하겠습니다."
          className="w-full rounded-md border border-ink-15 bg-white px-3 py-2 text-[13px] outline-none focus:border-error/60"
        />
      </label>
      {err ? (
        <p className="text-[12.5px] font-semibold text-error">{err}</p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
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
          {pending ? "처리 중…" : "해지 확정"}
        </button>
      </div>
    </form>
  );
}
