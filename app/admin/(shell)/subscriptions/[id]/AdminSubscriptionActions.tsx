"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminCancelSubscriptionAction,
  resendRegistrationLinkAction,
} from "@/lib/actions/subscriptions";
import type { SubscriptionStatus } from "@/lib/types/db";

export function AdminSubscriptionActions({
  subscriptionId,
  status,
  registrationUrl,
}: {
  subscriptionId: string;
  status: SubscriptionStatus;
  registrationUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(
    null,
  );
  const [resendUrl, setResendUrl] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  function onResend() {
    setMsg(null);
    setResendUrl(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", subscriptionId);
      const r = await resendRegistrationLinkAction(fd);
      if (!r.ok) {
        setMsg({ tone: "err", text: r.error ?? "재발급 실패" });
        return;
      }
      setResendUrl(r.registration_url);
      setMsg({ tone: "ok", text: "카드 등록 링크가 재발급되었습니다" });
      router.refresh();
    });
  }

  function onCancel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", subscriptionId);
      fd.set("reason", reason);
      const r = await adminCancelSubscriptionAction(fd);
      if (!r.ok) {
        setMsg({ tone: "err", text: r.error ?? "해지 실패" });
        return;
      }
      setMsg({ tone: "ok", text: "해지되었습니다" });
      setCancelOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === "pending_card" ? (
          <button
            type="button"
            disabled={pending}
            onClick={onResend}
            className="inline-flex h-10 items-center rounded-lg border border-iris/40 bg-white px-4 font-display text-[12.5px] font-bold text-iris hover:bg-iris-light disabled:opacity-60"
          >
            카드 등록 링크 재발급
          </button>
        ) : null}
        {registrationUrl && status === "pending_card" ? (
          <a
            href={registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-lg border border-ink-15 bg-white px-4 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30"
          >
            현재 링크 열기
          </a>
        ) : null}
        {status !== "canceled" ? (
          <button
            type="button"
            onClick={() => setCancelOpen((v) => !v)}
            className="inline-flex h-10 items-center rounded-lg border border-error/40 bg-white px-4 font-display text-[12.5px] font-bold text-error hover:bg-error/[0.06]"
          >
            구독 해지
          </button>
        ) : null}
      </div>

      {resendUrl ? (
        <div className="rounded-xl border border-iris/30 bg-iris-light/50 p-4">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-iris">
            신규 카드 등록 링크
          </p>
          <div className="mt-2 flex gap-2">
            <input
              readOnly
              value={resendUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[12px] outline-none"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(resendUrl)}
              className="inline-flex h-10 items-center rounded-lg border border-ink-15 bg-white px-3 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30"
            >
              복사
            </button>
          </div>
        </div>
      ) : null}

      {cancelOpen ? (
        <form
          onSubmit={onCancel}
          className="rounded-xl border border-error/30 bg-error/[0.04] p-4"
        >
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.08em] text-error">
              해지 사유 (내부 기록용)
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-ink-15 bg-white px-3 py-2 text-[13px] outline-none focus:border-error/60"
            />
          </label>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setCancelOpen(false)}
              className="inline-flex h-10 items-center rounded-lg border border-ink-15 bg-white px-4 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30 disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center rounded-lg bg-error px-5 font-display text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "처리 중…" : "해지 확정"}
            </button>
          </div>
        </form>
      ) : null}

      {msg ? (
        <p
          className={`text-[12.5px] font-semibold ${
            msg.tone === "ok" ? "text-success" : "text-error"
          }`}
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
