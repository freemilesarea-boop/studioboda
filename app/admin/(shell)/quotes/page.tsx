import Link from "next/link";
import { format } from "date-fns";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import { QuoteStatusBadge } from "@/components/admin/Badge";
import type { Quote, QuoteStatus } from "@/lib/types/db";
import { quoteStatusLabels } from "@/lib/types/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Quotes",
  robots: { index: false, follow: false },
};

const STATUSES: (QuoteStatus | "all")[] = [
  "all",
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
];

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = (
    STATUSES.includes(searchParams.status as QuoteStatus | "all")
      ? searchParams.status
      : "all"
  ) as QuoteStatus | "all";
  const admin = createAdminSupabase();
  let query = admin
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query;
  const rows = (data ?? []) as Quote[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
            Quotes
          </p>
          <h2 className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.4px] text-ink-100">
            견적 관리
          </h2>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => {
          const active = s === status;
          return (
            <Link
              key={s}
              href={`/admin/quotes${s === "all" ? "" : `?status=${s}`}`}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
                active
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              {s === "all" ? "전체" : quoteStatusLabels[s as QuoteStatus]}
            </Link>
          );
        })}
      </div>

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyState
            title="견적이 없습니다"
            description="문의에서 견적을 생성하거나 직접 작성할 수 있습니다."
          />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="min-w-full text-left text-[12.5px]">
              <thead className="border-b border-ink-15 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
                <tr>
                  <th className="px-5 py-2.5">제목</th>
                  <th className="px-3 py-2.5">서비스</th>
                  <th className="px-3 py-2.5 text-right">금액</th>
                  <th className="px-3 py-2.5">납기</th>
                  <th className="px-3 py-2.5">상태</th>
                  <th className="px-5 py-2.5 text-right">생성</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-15">
                {rows.map((q) => (
                  <tr key={q.id} className="hover:bg-ink-5">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/quotes/${q.id}`}
                        className="font-display font-bold text-ink-100 hover:text-iris"
                      >
                        {q.title}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-ink-70">
                      {q.service_type ?? "—"}
                    </td>
                    <td className="num px-3 py-3 text-right font-bold text-ink-100">
                      {new Intl.NumberFormat("ko-KR").format(q.total_price)}원
                    </td>
                    <td className="px-3 py-3 text-ink-70">
                      {q.delivery_days}일
                    </td>
                    <td className="px-3 py-3">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="px-5 py-3 text-right text-[11px] text-ink-50">
                      {format(new Date(q.created_at), "yyyy-MM-dd")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
