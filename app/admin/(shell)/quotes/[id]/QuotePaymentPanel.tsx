"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPaymentAction } from "@/lib/actions/payments";
import {
  paymentStatusLabels,
  paymentTypeLabels,
  type QuotePaymentStatus,
} from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";
import { AdminCard } from "@/components/admin/Card";

type QuoteSlim = {
  id: string;
  title: string;
  total_price: number;
  deposit_rate: number;
  deposit_amount: number;
  balance_amount: number;
  payment_status: QuotePaymentStatus;
};

type PaymentRow = {
  id: string;
  type: "deposit" | "balance" | "extra";
  title: string;
  amount: number;
  status: string;
  payapp_payurl: string | null;
  payapp_mul_no: string | null;
  paid_at: string | null;
  created_at: string;
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

const TYPE_TONE = {
  deposit: "bg-iris/15 text-iris",
  balance: "bg-sky/15 text-sky",
  extra: "bg-warning/15 text-warning",
} as const;

const STATUS_TONE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  paid: "bg-success/15 text-success",
  failed: "bg-error/15 text-error",
  cancelled: "bg-ink-5 text-ink-70",
  refunded: "bg-ink-5 text-ink-70",
};

export function QuotePaymentPanel({
  quote,
  payments,
}: {
  quote: QuoteSlim;
  payments: PaymentRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraTitle, setExtraTitle] = useState("");
  const [extraDescription, setExtraDescription] = useState("");
  const [extraAmount, setExtraAmount] = useState(50000);
  const { push } = useToast();
  const router = useRouter();

  const hasOpen = (type: "deposit" | "balance") =>
    payments.some(
      (p) => p.type === type && (p.status === "pending" || p.status === "paid"),
    );
  const depositPaid = payments.some((p) => p.type === "deposit" && p.status === "paid");
  const balancePaid = payments.some((p) => p.type === "balance" && p.status === "paid");

  function issue(type: "deposit" | "balance") {
    const label = type === "deposit" ? "예약금" : "본결제";
    const amount = type === "deposit" ? quote.deposit_amount : quote.balance_amount;
    const ok = window.confirm(
      `${label} ${fmt(amount)}원으로 결제 청구를 생성하시겠습니까?`,
    );
    if (!ok) return;
    startTransition(async () => {
      const r = await createPaymentAction({ quoteId: quote.id, type });
      if (r.ok) {
        push(`${label} 청구가 생성되었습니다`);
        router.refresh();
      } else {
        push((r as { error?: string }).error ?? "청구 생성 실패", "error");
      }
    });
  }

  function issueExtra() {
    if (!extraTitle.trim() || extraAmount <= 0) {
      push("제목과 금액을 정확히 입력해주세요", "error");
      return;
    }
    startTransition(async () => {
      const r = await createPaymentAction({
        quoteId: quote.id,
        type: "extra",
        title: extraTitle.trim(),
        description: extraDescription.trim() || undefined,
        amount: extraAmount,
      });
      if (r.ok) {
        push("추가결제 청구가 생성되었습니다");
        setExtraOpen(false);
        setExtraTitle("");
        setExtraDescription("");
        setExtraAmount(50000);
        router.refresh();
      } else {
        push((r as { error?: string }).error ?? "청구 생성 실패", "error");
      }
    });
  }

  return (
    <AdminCard title="결제 청구">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile
          label={`예약금 (${quote.deposit_rate}%)`}
          value={`${fmt(quote.deposit_amount)}원`}
          accent="iris"
          status={
            depositPaid
              ? "완료"
              : hasOpen("deposit")
              ? "대기"
              : "미발행"
          }
        />
        <Tile
          label="본결제"
          value={`${fmt(quote.balance_amount)}원`}
          accent="sky"
          status={
            balancePaid
              ? "완료"
              : hasOpen("balance")
              ? "대기"
              : "미발행"
          }
        />
        <Tile
          label="총 견적"
          value={`${fmt(quote.total_price)}원`}
          status={
            quote.payment_status === "fully_paid"
              ? "전체 완료"
              : quote.payment_status === "deposit_paid"
              ? "예약금 완료"
              : "미결제"
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || hasOpen("deposit")}
          onClick={() => issue("deposit")}
          className="inline-flex h-10 items-center rounded-lg bg-iris px-4 font-display text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {hasOpen("deposit") ? "예약금 발행됨" : "예약금 청구 발행"}
        </button>
        <button
          type="button"
          disabled={pending || hasOpen("balance")}
          onClick={() => issue("balance")}
          className="inline-flex h-10 items-center rounded-lg bg-sky px-4 font-display text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {hasOpen("balance") ? "본결제 발행됨" : "본결제 청구 발행"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setExtraOpen((v) => !v)}
          className="inline-flex h-10 items-center rounded-lg border border-ink-15 px-4 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100 disabled:opacity-50"
        >
          {extraOpen ? "추가결제 닫기" : "+ 추가결제 청구"}
        </button>
      </div>

      {extraOpen ? (
        <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-ink-15 bg-ink-5 p-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
              제목 *
            </span>
            <input
              value={extraTitle}
              onChange={(e) => setExtraTitle(e.target.value)}
              placeholder="예: 추가 수정 1회 · 급행비 · 배너 3종"
              className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60"
              maxLength={120}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
              설명 (선택)
            </span>
            <textarea
              rows={2}
              value={extraDescription}
              onChange={(e) => setExtraDescription(e.target.value)}
              className="w-full resize-y rounded-md border border-ink-15 bg-white px-3 py-2 text-[13px] outline-none focus:border-iris/60"
              maxLength={500}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
              금액 (KRW) *
            </span>
            <input
              type="number"
              min={1000}
              step={1000}
              value={extraAmount}
              onChange={(e) => setExtraAmount(Number(e.target.value))}
              className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60"
            />
          </label>
          <div className="flex items-end justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={issueExtra}
              className="inline-flex h-10 items-center rounded-lg bg-warning px-4 font-display text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "생성 중…" : "추가결제 청구 발행"}
            </button>
          </div>
        </div>
      ) : null}

      {payments.length > 0 ? (
        <div className="mt-5 border-t border-ink-15 pt-4">
          <p className="font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
            발행된 청구
          </p>
          <ul className="mt-2 divide-y divide-ink-15">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 py-2.5 text-[12.5px]"
              >
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] ${TYPE_TONE[p.type]}`}
                >
                  {paymentTypeLabels[p.type]}
                </span>
                <p className="min-w-0 flex-1 truncate font-display font-bold text-ink-100">
                  {p.title}
                </p>
                <p className="num shrink-0 font-display font-bold text-ink-100">
                  {fmt(p.amount)}원
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_TONE[p.status] ?? "bg-ink-5 text-ink-70"}`}
                >
                  {paymentStatusLabels[p.status as keyof typeof paymentStatusLabels] ??
                    p.status}
                </span>
                {p.payapp_payurl ? (
                  <a
                    href={p.payapp_payurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-iris hover:underline"
                  >
                    링크 ↗
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </AdminCard>
  );
}

function Tile({
  label,
  value,
  accent,
  status,
}: {
  label: string;
  value: string;
  accent?: "iris" | "sky";
  status: string;
}) {
  const tone =
    accent === "iris" ? "text-iris" : accent === "sky" ? "text-sky" : "text-ink-100";
  return (
    <div className="rounded-xl border border-ink-15 bg-white px-3 py-3">
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </p>
      <p
        className={`num mt-1 font-display text-[18px] font-extrabold tracking-tightish ${tone}`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10.5px] text-ink-50">{status}</p>
    </div>
  );
}
