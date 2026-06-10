import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { getProfile } from "@/lib/auth";
import { listMyInquiries } from "@/lib/queries/customer";
import { inquiryStatusLabels, type InquiryStatus } from "@/lib/types/db";
import { MeListFilter } from "@/components/me/MeListFilter";

export const metadata: Metadata = {
  title: "내 문의",
  robots: { index: false, follow: false },
};

const TONE: Record<InquiryStatus, string> = {
  new: "bg-iris/15 text-iris",
  contacted: "bg-sky/15 text-sky",
  quoted: "bg-warning/15 text-warning",
  converted: "bg-success/15 text-success",
  in_progress: "bg-iris/15 text-iris",
  completed: "bg-success/15 text-success",
  archived: "bg-ink-5 text-ink-70",
};

export default async function MyInquiriesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const me = await getProfile();
  if (!me) return null; // layout redirects
  const inquiries = await listMyInquiries(me.id, me.email);

  const status = searchParams.status ?? "all";
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const filtered = inquiries.filter((i) => {
    if (status !== "all" && i.status !== status) return false;
    if (q) {
      const hay = `${i.service_type ?? ""} ${i.message ?? ""} ${i.budget_range ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const present = Array.from(new Set(inquiries.map((i) => i.status))) as InquiryStatus[];
  const statusChips = [
    { key: "all", label: "전체", count: inquiries.length },
    ...present.map((s) => ({
      key: s,
      label: inquiryStatusLabels[s],
      count: inquiries.filter((i) => i.status === s).length,
    })),
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
            Inquiries
          </p>
          <h1 className="mt-1 font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
            내 문의{" "}
            <span className="num ml-1.5 text-[13px] font-bold text-ink-50">
              {inquiries.length}
            </span>
          </h1>
        </div>
        <Link
          href="/#inquiry"
          className="inline-flex h-10 items-center rounded-lg bg-ink-100 px-4 font-display text-[12.5px] font-bold text-white hover:bg-ink-90"
        >
          새 문의 작성 →
        </Link>
      </header>

      {inquiries.length > 0 ? (
        <MeListFilter
          basePath="/me/inquiries"
          statuses={statusChips}
          current={{ status, q: searchParams.q ?? "" }}
          placeholder="서비스·내용·예산 검색"
          total={filtered.length}
        />
      ) : null}

      {inquiries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-12 text-center">
          <i className="ti ti-mail text-[26px] text-ink-30" aria-hidden />
          <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
            아직 접수된 문의가 없습니다
          </p>
          <p className="mt-1 text-[12px] text-ink-50">
            메인 페이지의 견적 폼에서 첫 문의를 시작해보세요.
          </p>
          <Link
            href="/#inquiry"
            className="mt-4 inline-flex h-9 items-center rounded-lg bg-ink-100 px-4 font-display text-[12px] font-bold text-white hover:bg-ink-90"
          >
            견적 문의 →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-10 text-center text-[13px] text-ink-50">
          조건에 맞는 문의가 없습니다.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((i) => (
            <li
              key={i.id}
              className="rounded-2xl border border-ink-15 bg-white px-4 py-4 sm:px-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link
                  href={`/me/inquiries/${i.id}`}
                  className="font-display text-[14px] font-bold text-ink-100 hover:text-iris"
                >
                  {i.service_type ?? "(서비스 미선택)"}
                  {i.budget_range ? (
                    <span className="ml-2 text-[11.5px] font-medium text-ink-50">
                      · 예산 {i.budget_range}
                    </span>
                  ) : null}
                </Link>
                <span
                  className={`rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption ${TONE[i.status]}`}
                >
                  {inquiryStatusLabels[i.status]}
                </span>
              </div>
              {i.message ? (
                <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-[12.5px] leading-body text-ink-70">
                  {i.message}
                </p>
              ) : null}
              <p className="mt-2 text-[11px] text-ink-50">
                접수{" "}
                {formatDistanceToNow(new Date(i.created_at), {
                  locale: ko,
                  addSuffix: true,
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
