"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reconcilePendingPaymentsAction } from "@/lib/actions/payment-reconcile";
import { useToast } from "@/components/admin/Toast";

// Staff fallback when a PayApp webhook is dropped: re-query PayApp for every
// pending payment and apply paid status. Safe to run anytime (idempotent).
export function ReconcileButton() {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function run() {
    startTransition(async () => {
      const r = await reconcilePendingPaymentsAction();
      if (r.ok) {
        push(
          `결제 동기화 완료 · 확인 ${r.checked}건 / 결제완료 ${r.paid}건 / 환불 ${r.refunded}건`,
          r.paid > 0 || r.refunded > 0 ? "success" : undefined,
        );
        router.refresh();
      } else {
        push(r.error ?? "동기화 실패", "error");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={run}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-iris/30 bg-iris/10 px-3 font-display text-[12px] font-bold text-iris hover:bg-iris/15 disabled:opacity-50"
    >
      <i className="ti ti-refresh text-[14px]" aria-hidden />
      {pending ? "동기화 중…" : "결제 동기화"}
    </button>
  );
}
