"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelPaymentAction,
  refundPaymentAction,
} from "@/lib/actions/payments";
import type { PaymentStatus } from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export function RefundButton({
  paymentId,
  status,
  amount,
}: {
  paymentId: string;
  status: PaymentStatus;
  amount: number;
}) {
  const [mode, setMode] = useState<"idle" | "cancel" | "refund">("idle");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function submit() {
    if (!reason.trim() && mode === "refund") {
      push("환불 사유를 입력해주세요", "error");
      return;
    }
    startTransition(async () => {
      const r =
        mode === "cancel"
          ? await cancelPaymentAction(paymentId, reason)
          : await refundPaymentAction(paymentId, reason);
      if (r.ok) {
        push(
          mode === "cancel"
            ? "결제가 취소되었습니다"
            : "환불 처리되었습니다",
        );
        setMode("idle");
        setReason("");
        router.refresh();
      } else {
        push((r as { error?: string }).error ?? "처리 실패", "error");
      }
    });
  }

  if (status === "cancelled" || status === "refunded" || status === "failed") {
    return <span className="text-[11px] text-ink-50">—</span>;
  }

  if (mode !== "idle") {
    const accent = mode === "refund" ? "border-error" : "border-warning";
    return (
      <div
        className={`mt-1 w-full max-w-[280px] rounded-md border ${accent} bg-white p-2 text-left`}
      >
        <p className="text-[11px] text-ink-70">
          {mode === "refund"
            ? `환불: ${fmt(amount)}원 · 사유 필수`
            : "취소 사유 (선택)"}
        </p>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            mode === "refund"
              ? "환불 사유를 입력하세요 (필수, 1000자 이내)"
              : "취소 사유 (선택)"
          }
          maxLength={500}
          className="mt-1 w-full resize-y rounded-md border border-ink-15 bg-white px-2 py-1.5 text-[12px] outline-none focus:border-iris/60"
        />
        <p className="mt-1 text-[10px] text-ink-50">
          {mode === "refund"
            ? "PayApp paycancel이 성공해야만 환불 처리됩니다. 실패 시 상태는 그대로 유지되고 'PayApp 콘솔 확인 필요'로 안내됩니다."
            : "PayApp 측에도 paycancel 요청을 시도합니다."}
        </p>
        <div className="mt-2 flex justify-end gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMode("idle");
              setReason("");
            }}
            className="rounded-md border border-ink-15 px-2 py-1 text-[11px] font-bold text-ink-70 hover:border-ink-30"
          >
            취소
          </button>
          <button
            type="button"
            disabled={pending || (mode === "refund" && !reason.trim())}
            onClick={submit}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-50 ${
              mode === "refund"
                ? "bg-error hover:opacity-90"
                : "bg-warning hover:opacity-90"
            }`}
          >
            {pending ? "처리 중…" : "확정"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {status === "pending" ? (
        <button
          type="button"
          onClick={() => setMode("cancel")}
          className="rounded-md border border-warning/40 px-2.5 py-1 text-[11px] font-bold text-warning hover:bg-warning/10"
        >
          취소
        </button>
      ) : null}
      {status === "paid" ? (
        <button
          type="button"
          onClick={() => setMode("refund")}
          className="rounded-md border border-error/40 px-2.5 py-1 text-[11px] font-bold text-error hover:bg-error/10"
        >
          환불 처리
        </button>
      ) : null}
    </div>
  );
}
