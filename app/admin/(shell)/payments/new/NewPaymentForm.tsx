"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPaymentAction } from "@/lib/actions/payments";
import { useToast } from "@/components/admin/Toast";
import type { PaymentType, QuotePaymentStatus } from "@/lib/types/db";

type QuoteSummary = {
  id: string;
  title: string;
  service_type: string | null;
  total_price: number;
  deposit_rate: number;
  deposit_amount: number | null;
  balance_amount: number | null;
  payment_status: QuotePaymentStatus;
  payment_status_label: string;
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export function NewPaymentForm({ quotes }: { quotes: QuoteSummary[] }) {
  const [quoteId, setQuoteId] = useState(quotes[0]?.id ?? "");
  const [type, setType] = useState<PaymentType>("deposit");
  const [extraTitle, setExtraTitle] = useState("");
  const [extraDescription, setExtraDescription] = useState("");
  const [extraAmount, setExtraAmount] = useState<number>(50000);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { ok: true; paymentId: string; payUrl: string; qrUrl?: string }
    | null
  >(null);
  const { push } = useToast();
  const router = useRouter();

  const quote = useMemo(
    () => quotes.find((q) => q.id === quoteId),
    [quotes, quoteId],
  );

  const computed = useMemo(() => {
    if (!quote) return { deposit: 0, balance: 0 };
    const rate = quote.deposit_rate ?? 10;
    const dep = quote.deposit_amount ?? Math.round((quote.total_price * rate) / 100);
    const bal = quote.balance_amount ?? quote.total_price - dep;
    return { deposit: dep, balance: bal };
  }, [quote]);

  const finalAmount =
    type === "deposit"
      ? computed.deposit
      : type === "balance"
      ? computed.balance
      : extraAmount;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quote) {
      push("견적을 선택해주세요", "error");
      return;
    }
    if (type === "extra" && (!extraTitle.trim() || extraAmount <= 0)) {
      push("제목과 금액을 정확히 입력해주세요", "error");
      return;
    }
    startTransition(async () => {
      const r = await createPaymentAction({
        quoteId: quote.id,
        type,
        title: type === "extra" ? extraTitle.trim() : undefined,
        description:
          type === "extra"
            ? extraDescription.trim() || undefined
            : undefined,
        amount: type === "extra" ? extraAmount : undefined,
      });
      if (!r.ok) {
        push(r.error ?? "결제 생성 실패", "error");
        return;
      }
      push("결제 청구가 생성되었습니다");
      setResult({
        ok: true,
        paymentId: r.paymentId,
        payUrl: r.payUrl,
        qrUrl: r.qrUrl,
      });
      router.refresh();
    });
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-success/30 bg-success/[0.05] p-5">
          <p className="font-display text-[13px] font-bold text-success">
            결제 청구가 생성되었습니다. 고객의 /me/payments에 즉시 노출됩니다.
          </p>
          <p className="mt-1 text-[12px] text-ink-70">
            결제 ID: <span className="font-mono">{result.paymentId}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={result.payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-lg bg-ink-100 px-4 font-display text-[12.5px] font-bold text-white hover:bg-ink-90"
            >
              PayApp 결제 링크 열기 ↗
            </a>
            {result.qrUrl ? (
              <a
                href={result.qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-lg border border-ink-15 px-4 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
              >
                QR 코드
              </a>
            ) : null}
            <Link
              href="/admin/payments"
              className="inline-flex h-10 items-center rounded-lg border border-ink-15 px-4 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
            >
              결제 목록으로
            </Link>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="inline-flex h-10 items-center rounded-lg border border-ink-15 px-4 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
            >
              한 건 더 만들기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-2xl border border-ink-15 bg-white p-5">
        <label className="block">
          <span className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
            견적 선택
          </span>
          <select
            value={quoteId}
            onChange={(e) => setQuoteId(e.target.value)}
            className="h-11 w-full rounded-lg border border-ink-15 bg-white px-3 text-[13.5px] outline-none focus:border-iris/60"
          >
            {quotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} · {fmt(q.total_price)}원 · {q.payment_status_label}
              </option>
            ))}
          </select>
        </label>

        {quote ? (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Tile label="총 견적" value={`${fmt(quote.total_price)}원`} />
            <Tile
              label={`예약금 (${quote.deposit_rate}%)`}
              value={`${fmt(computed.deposit)}원`}
              accent="iris"
            />
            <Tile label="본결제" value={`${fmt(computed.balance)}원`} accent="sky" />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-ink-15 bg-white p-5">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
          결제 유형
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["deposit", "balance", "extra"] as PaymentType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border px-3 py-2.5 font-display text-[12.5px] font-bold transition-colors ${
                type === t
                  ? "border-iris bg-iris text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30 hover:text-ink-100"
              }`}
            >
              {t === "deposit"
                ? "예약금"
                : t === "balance"
                ? "본결제"
                : "추가결제"}
            </button>
          ))}
        </div>

        {type === "extra" ? (
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
                제목 *
              </span>
              <input
                value={extraTitle}
                onChange={(e) => setExtraTitle(e.target.value)}
                placeholder="예: 추가 수정 1회 · 급행 비용 · 배너 추가 3종"
                className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60"
                maxLength={120}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
                설명 (선택)
              </span>
              <textarea
                rows={2}
                value={extraDescription}
                onChange={(e) => setExtraDescription(e.target.value)}
                placeholder="고객에게 보일 내역 설명"
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
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-ink-15 bg-ink-5 px-4 py-3 text-[12.5px] text-ink-70">
            금액은 견적과 비율로 서버에서 자동 계산됩니다. 수동 입력 불가.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-ink-100 bg-ink-100 p-5 text-white">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-iris-glow">
            최종 청구 금액
          </p>
          <p className="num font-display text-[28px] font-extrabold tracking-tightish">
            {fmt(finalAmount)}원
          </p>
        </div>
        <p className="mt-2 text-[11.5px] text-ink-30">
          이 금액은 서버에서 다시 계산·검증된 후 PayApp에 전송됩니다.
          클라이언트 값은 신뢰하지 않습니다.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Link
          href="/admin/payments"
          className="inline-flex h-11 items-center rounded-lg border border-ink-15 px-5 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending || !quote}
          className="inline-flex h-11 items-center rounded-lg bg-iris px-6 font-display text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "생성 중…" : "결제 청구 생성 →"}
        </button>
      </div>
    </form>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "iris" | "sky";
}) {
  const tone =
    accent === "iris" ? "text-iris" : accent === "sky" ? "text-sky" : "text-ink-100";
  return (
    <div className="rounded-lg border border-ink-15 bg-ink-5 px-3 py-2.5">
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </p>
      <p
        className={`num mt-1 font-display text-[16px] font-extrabold tracking-[-0.3px] ${tone}`}
      >
        {value}
      </p>
    </div>
  );
}
