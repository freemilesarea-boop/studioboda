"use client";

import { useState, useTransition } from "react";
import { checkPayAppPaymentStatusAction } from "@/lib/actions/payments";
import { useToast } from "@/components/admin/Toast";

type Ok = Extract<
  Awaited<ReturnType<typeof checkPayAppPaymentStatusAction>>,
  { ok: true }
>;

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

/**
 * Read-only "PayApp 상태조회" — shows authoritative PayApp state next to the
 * local DB status. No mutations. Hidden when the payment has no mul_no.
 */
export function PayAppStatusButton({
  paymentId,
  hasMulNo,
  localStatus,
}: {
  paymentId: string;
  hasMulNo: boolean;
  localStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const [res, setRes] = useState<Ok | null>(null);
  const { push } = useToast();

  if (!hasMulNo) return null;

  function run() {
    startTransition(async () => {
      const r = await checkPayAppPaymentStatusAction(paymentId);
      if (r.ok) setRes(r);
      else push(r.error ?? "PayApp 상태 조회 실패", "error");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-md border border-ink-15 px-2.5 py-1 text-[11px] font-bold text-ink-70 hover:border-iris hover:text-iris disabled:opacity-50"
      >
        {pending ? "조회 중…" : "PayApp 상태조회"}
      </button>

      {res ? (
        <div
          className={`mt-0.5 w-full max-w-[260px] rounded-md border p-2 text-left text-[11px] ${
            res.mismatch
              ? "border-error/40 bg-error/[0.05]"
              : "border-success/40 bg-success/[0.05]"
          }`}
        >
          <p className="text-ink-70">
            로컬: <b className="text-ink-100">{res.current_local_status}</b>
          </p>
          <p className="text-ink-70">
            PayApp:{" "}
            <b className="text-ink-100">
              {res.provider_state_label} (state={res.provider_state || "?"})
            </b>
          </p>
          {res.provider_amount != null ? (
            <p className="text-ink-50">
              금액 {fmt(res.provider_amount)}원
              {res.amount_match === false ? " · ⚠️ 로컬 금액과 불일치" : ""}
            </p>
          ) : null}
          <p
            className={`mt-1 font-bold ${
              res.mismatch ? "text-error" : "text-success"
            }`}
          >
            {res.mismatch
              ? "로컬/PayApp 상태 불일치 — 확인 필요"
              : "정상 (로컬과 일치)"}
          </p>
          <p className="mt-0.5 text-[10px] text-ink-50">
            조회 {new Date(res.checked_at).toLocaleString("ko-KR")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
