import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getProfile } from "@/lib/auth";
import { getMyQuote } from "@/lib/queries/customer";
import {
  quoteStatusLabels,
  type QuoteOption,
  type QuoteStatus,
} from "@/lib/types/db";
import { QuoteActions } from "./QuoteActions";

export const metadata: Metadata = {
  title: "견적 상세",
  robots: { index: false, follow: false },
};

const TONE: Record<QuoteStatus, string> = {
  draft: "bg-ink-15 text-ink-70",
  sent: "bg-iris/15 text-iris",
  customer_review: "bg-warning/15 text-warning",
  accepted: "bg-success/15 text-success",
  rejected: "bg-error/15 text-error",
  expired: "bg-ink-5 text-ink-70",
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export default async function MyQuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getProfile();
  if (!me) return null;
  const q = await getMyQuote(me.id, params.id);
  if (!q) notFound();

  const options = (q.options as QuoteOption[]) ?? [];
  const canActOn = ["sent", "customer_review", "draft"].includes(q.status);

  return (
    <div className="space-y-5">
      <Link
        href="/me/quotes"
        className="inline-flex items-center gap-1 text-[12px] text-ink-50 hover:text-iris"
      >
        ← 견적 목록
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
            {q.title}
          </h1>
          <p className="mt-1 text-[12px] text-ink-50">
            발행{" "}
            <span className="num">
              {format(new Date(q.created_at), "yyyy-MM-dd HH:mm")}
            </span>
            {q.expires_at
              ? ` · 만료 ${format(new Date(q.expires_at), "yyyy-MM-dd")}`
              : ""}
            {q.customer_accepted_at
              ? ` · 수락 ${format(new Date(q.customer_accepted_at), "yyyy-MM-dd")}`
              : ""}
            {q.customer_rejected_at
              ? ` · 거절 ${format(new Date(q.customer_rejected_at), "yyyy-MM-dd")}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href={`/quote/${q.id}/print`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-15 px-3 py-1.5 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
          >
            <i className="ti ti-download text-[14px]" aria-hidden />
            견적서 PDF
          </Link>
          <span
            className={`rounded-full px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-caption ${TONE[q.status]}`}
          >
            {quoteStatusLabels[q.status]}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[13px] font-bold text-ink-100">
          내역
        </h2>
        <table className="mt-3 w-full text-left text-[13px]">
          <tbody className="divide-y divide-ink-15">
            <tr>
              <td className="py-2.5 text-ink-70">기본 금액</td>
              <td className="num py-2.5 text-right font-bold text-ink-100">
                {fmt(q.base_price)}원
              </td>
            </tr>
            {options.map((o, i) => (
              <tr key={i}>
                <td className="py-2.5 text-ink-70">+ {o.label}</td>
                <td className="num py-2.5 text-right text-ink-100">
                  {fmt(o.price)}원
                </td>
              </tr>
            ))}
            <tr>
              <td className="py-2.5 text-ink-70">납기</td>
              <td className="py-2.5 text-right text-ink-100">
                {q.delivery_days}일
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink-100">
              <td className="py-3 font-display text-[14px] font-bold text-ink-100">
                합계 (VAT 별도)
              </td>
              <td className="num py-3 text-right font-display text-[22px] font-extrabold text-ink-100">
                {fmt(q.total_price)}원
              </td>
            </tr>
          </tfoot>
        </table>

        {q.notes ? (
          <div className="mt-4 whitespace-pre-wrap rounded-md border border-ink-15 bg-ink-5 px-4 py-3 text-[12.5px] leading-body text-ink-70">
            {q.notes}
          </div>
        ) : null}
      </section>

      <QuoteActions
        quoteId={q.id}
        canActOn={canActOn}
        currentStatus={q.status}
      />
    </div>
  );
}
