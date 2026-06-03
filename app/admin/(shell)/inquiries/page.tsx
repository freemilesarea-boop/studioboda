import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import { InquiryStatusBadge } from "@/components/admin/Badge";
import type { Inquiry, InquiryStatus } from "@/lib/types/db";
import { inquiryStatusLabels } from "@/lib/types/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Inquiries",
  robots: { index: false, follow: false },
};

const STATUSES: (InquiryStatus | "all")[] = [
  "all",
  "new",
  "contacted",
  "quoted",
  "converted",
  "archived",
];
const PAGE_SIZE = 20;

async function loadInquiries(
  status: InquiryStatus | "all",
  q: string,
  page: number,
) {
  const admin = createAdminSupabase();
  let query = admin
    .from("inquiries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (q) {
    const safe = q.replace(/[,()]/g, " ");
    query = query.or(
      `name.ilike.%${safe}%,email.ilike.%${safe}%,company.ilike.%${safe}%`,
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);
  const { data, count } = await query;
  const rows = (data ?? []) as Inquiry[];

  // Attachment counts for the visible page.
  const fileCounts = new Map<string, number>();
  if (rows.length > 0) {
    const { data: fileRows } = await admin
      .from("inquiry_files")
      .select("inquiry_id")
      .in(
        "inquiry_id",
        rows.map((r) => r.id),
      );
    for (const f of (fileRows ?? []) as { inquiry_id: string }[]) {
      fileCounts.set(f.inquiry_id, (fileCounts.get(f.inquiry_id) ?? 0) + 1);
    }
  }
  return { rows, total: count ?? 0, fileCounts };
}

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  const status = (
    STATUSES.includes(searchParams.status as InquiryStatus | "all")
      ? searchParams.status
      : "all"
  ) as InquiryStatus | "all";
  const q = (searchParams.q ?? "").trim();
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const { rows, total, fileCounts } = await loadInquiries(status, q, page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
            Inquiries
          </p>
          <h2 className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.4px] text-ink-100">
            문의 관리
            <span className="num ml-2 font-display text-[14px] font-bold text-ink-50">
              {total}
            </span>
          </h2>
        </div>
        <form className="flex gap-2" action="/admin/inquiries">
          <input
            type="hidden"
            name="status"
            value={status === "all" ? "" : status}
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="이름·이메일·회사 검색"
            className="h-9 w-[220px] rounded-lg border border-ink-15 bg-white px-3 text-[12.5px] text-ink-100 outline-none focus:border-iris/60"
          />
          <button
            type="submit"
            className="h-9 rounded-lg bg-ink-100 px-3.5 font-display text-[12px] font-bold text-white"
          >
            검색
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => {
          const active = s === status;
          const params = new URLSearchParams();
          if (s !== "all") params.set("status", s);
          if (q) params.set("q", q);
          return (
            <Link
              key={s}
              href={`/admin/inquiries${params.toString() ? `?${params.toString()}` : ""}`}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
                active
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              {s === "all" ? "전체" : inquiryStatusLabels[s as InquiryStatus]}
            </Link>
          );
        })}
      </div>

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyState
            title="조건에 맞는 문의가 없습니다"
            description="필터를 조정하거나 검색어를 비워보세요."
          />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="min-w-full text-left text-[12.5px]">
              <thead className="border-b border-ink-15 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
                <tr>
                  <th className="px-5 py-2.5">이름</th>
                  <th className="px-3 py-2.5">이메일</th>
                  <th className="px-3 py-2.5">회사</th>
                  <th className="px-3 py-2.5">서비스</th>
                  <th className="px-3 py-2.5">상태</th>
                  <th className="px-5 py-2.5 text-right">접수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-15">
                {rows.map((i) => (
                  <tr key={i.id} className="hover:bg-ink-5">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/inquiries/${i.id}`}
                        className="font-display font-bold text-ink-100 hover:text-iris"
                      >
                        {i.name}
                      </Link>
                      {fileCounts.get(i.id) ? (
                        <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-iris/10 px-1.5 py-0.5 text-[10px] font-bold text-iris align-middle">
                          <i className="ti ti-paperclip text-[11px]" aria-hidden />
                          첨부 {fileCounts.get(i.id)}개
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-ink-70">{i.email}</td>
                    <td className="px-3 py-3 text-ink-70">{i.company ?? "—"}</td>
                    <td className="px-3 py-3 text-ink-70">
                      {i.service_type ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <InquiryStatusBadge status={i.status} />
                    </td>
                    <td className="px-5 py-3 text-right text-[11px] text-ink-50">
                      {formatDistanceToNow(new Date(i.created_at), {
                        locale: ko,
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {totalPages > 1 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          status={status}
          q={q}
        />
      ) : null}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  status,
  q,
}: {
  page: number;
  totalPages: number;
  status: string;
  q: string;
}) {
  const linkFor = (n: number) => {
    const p = new URLSearchParams();
    if (status && status !== "all") p.set("status", status);
    if (q) p.set("q", q);
    if (n > 1) p.set("page", String(n));
    return `/admin/inquiries${p.toString() ? `?${p.toString()}` : ""}`;
  };
  return (
    <nav className="flex items-center justify-end gap-2 text-[12px]">
      {page > 1 ? (
        <Link
          href={linkFor(page - 1)}
          className="rounded-md border border-ink-15 bg-white px-2.5 py-1.5 text-ink-70 hover:border-ink-30"
        >
          이전
        </Link>
      ) : null}
      <span className="num text-ink-50">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={linkFor(page + 1)}
          className="rounded-md border border-ink-15 bg-white px-2.5 py-1.5 text-ink-70 hover:border-ink-30"
        >
          다음
        </Link>
      ) : null}
    </nav>
  );
}
