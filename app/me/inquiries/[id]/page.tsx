import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getProfile } from "@/lib/auth";
import { getMyInquiry } from "@/lib/queries/customer";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  inquiryStatusLabels,
  type InquiryStatus,
  type Quote,
} from "@/lib/types/db";

export const metadata: Metadata = {
  title: "문의 상세",
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

export default async function MyInquiryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getProfile();
  if (!me) return null;
  const inquiry = await getMyInquiry(me.id, me.email, params.id);
  if (!inquiry) notFound();

  const admin = createAdminSupabase();
  const { data: quotes } = await admin
    .from("quotes")
    .select("*")
    .eq("inquiry_id", inquiry.id)
    .eq("user_id", me.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <Link
        href="/me/inquiries"
        className="inline-flex items-center gap-1 text-[12px] text-ink-50 hover:text-iris"
      >
        ← 문의 목록
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
            {inquiry.service_type ?? "(서비스 미선택)"}
          </h1>
          <p className="mt-1 text-[12px] text-ink-50">
            접수 {format(new Date(inquiry.created_at), "yyyy-MM-dd HH:mm")}
            {inquiry.budget_range ? ` · 예산 ${inquiry.budget_range}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-caption ${TONE[inquiry.status]}`}
        >
          {inquiryStatusLabels[inquiry.status]}
        </span>
      </header>

      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[13px] font-bold text-ink-100">
          문의 내용
        </h2>
        <div className="mt-3 whitespace-pre-wrap rounded-md border border-ink-15 bg-ink-5 px-4 py-3 text-[13px] leading-body text-ink-70">
          {inquiry.message || "메시지가 없습니다."}
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <Row label="이름" value={inquiry.name} />
          <Row label="이메일" value={inquiry.email} />
          {inquiry.phone ? <Row label="전화" value={inquiry.phone} /> : null}
          {inquiry.company ? <Row label="회사" value={inquiry.company} /> : null}
        </dl>
      </section>

      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[13px] font-bold text-ink-100">
          연결된 견적
        </h2>
        {(quotes ?? []).length === 0 ? (
          <p className="mt-3 text-[12.5px] text-ink-50">
            아직 견적이 발행되지 않았습니다. 평균 24시간 이내에 회신드립니다.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-15">
            {((quotes ?? []) as Quote[]).map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between py-3"
              >
                <Link
                  href={`/me/quotes/${q.id}`}
                  className="font-display text-[13px] font-bold text-ink-100 hover:text-iris"
                >
                  {q.title}
                </Link>
                <div className="flex items-center gap-3 text-[12px] text-ink-70">
                  <span className="num font-bold">
                    {new Intl.NumberFormat("ko-KR").format(q.total_price)}원
                  </span>
                  <span className="font-display text-[10px] font-bold uppercase tracking-caption text-ink-50">
                    {q.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-ink-15/60 py-1.5 last:border-b-0">
      <dt className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-caption text-ink-50">
        {label}
      </dt>
      <dd className="text-[13px] text-ink-100">{value}</dd>
    </div>
  );
}
