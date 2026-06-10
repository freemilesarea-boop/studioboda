import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getProfile } from "@/lib/auth";
import { listMyQuotes } from "@/lib/queries/customer";
import { quoteStatusLabels, type QuoteStatus } from "@/lib/types/db";
import { MeListFilter } from "@/components/me/MeListFilter";

export const metadata: Metadata = {
  title: "내 견적",
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

export default async function MyQuotesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const me = await getProfile();
  if (!me) return null;
  const quotes = await listMyQuotes(me.id);

  const status = searchParams.status ?? "all";
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const filtered = quotes.filter((x) => {
    if (status !== "all" && x.status !== status) return false;
    if (q && !`${x.title} ${x.service_type ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const present = Array.from(new Set(quotes.map((x) => x.status))) as QuoteStatus[];
  const statusChips = [
    { key: "all", label: "전체", count: quotes.length },
    ...present.map((s) => ({
      key: s,
      label: quoteStatusLabels[s],
      count: quotes.filter((x) => x.status === s).length,
    })),
  ];

  return (
    <div className="space-y-5">
      <header>
        <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
          Quotes
        </p>
        <h1 className="mt-1 font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
          내 견적{" "}
          <span className="num ml-1.5 text-[13px] font-bold text-ink-50">
            {quotes.length}
          </span>
        </h1>
      </header>

      {quotes.length > 0 ? (
        <MeListFilter
          basePath="/me/quotes"
          statuses={statusChips}
          current={{ status, q: searchParams.q ?? "" }}
          placeholder="견적 제목·서비스 검색"
          total={filtered.length}
        />
      ) : null}

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-12 text-center">
          <i className="ti ti-file-invoice text-[26px] text-ink-30" aria-hidden />
          <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
            발행된 견적이 없습니다
          </p>
          <p className="mt-1 text-[12px] text-ink-50">
            문의가 검토되면 견적서가 발송됩니다.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-10 text-center text-[13px] text-ink-50">
          조건에 맞는 견적이 없습니다.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((q) => (
            <li
              key={q.id}
              className="rounded-2xl border border-ink-15 bg-white px-4 py-4 sm:px-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link
                  href={`/me/quotes/${q.id}`}
                  className="font-display text-[14px] font-bold text-ink-100 hover:text-iris"
                >
                  {q.title}
                </Link>
                <span
                  className={`rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption ${TONE[q.status]}`}
                >
                  {quoteStatusLabels[q.status]}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12px] text-ink-50">
                <span>
                  서비스 <b className="text-ink-100">{q.service_type ?? "—"}</b>
                </span>
                <span>
                  납기 <b className="text-ink-100">{q.delivery_days}일</b>
                </span>
                <span>
                  생성{" "}
                  <span className="num text-ink-100">
                    {format(new Date(q.created_at), "yyyy-MM-dd")}
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-ink-15 pt-3">
                <p className="num font-display text-[18px] font-extrabold tracking-tightish text-ink-100">
                  {fmt(q.total_price)}원{" "}
                  <span className="ml-1 text-[11px] font-normal text-ink-50">
                    VAT 별도
                  </span>
                </p>
                <Link
                  href={`/me/quotes/${q.id}`}
                  className="font-display text-[12.5px] font-bold text-iris hover:opacity-80"
                >
                  자세히 보기 →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
