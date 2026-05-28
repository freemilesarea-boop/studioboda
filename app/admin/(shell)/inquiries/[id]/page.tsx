import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard } from "@/components/admin/Card";
import { InquiryStatusBadge } from "@/components/admin/Badge";
import type { Inquiry, Quote } from "@/lib/types/db";
import { InquiryActions } from "./InquiryActions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 문의 상세",
  robots: { index: false, follow: false },
};

export default async function InquiryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminSupabase();
  const [{ data: inquiry }, { data: quotes }] = await Promise.all([
    admin.from("inquiries").select("*").eq("id", params.id).maybeSingle(),
    admin
      .from("quotes")
      .select("*")
      .eq("inquiry_id", params.id)
      .order("created_at", { ascending: false }),
  ]);
  if (!inquiry) notFound();
  const i = inquiry as Inquiry;
  const qs = (quotes ?? []) as Quote[];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href="/admin/inquiries" className="hover:text-iris">
          ← 문의 목록
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
            {i.name}
          </h2>
          <p className="mt-1 text-[12px] text-ink-50">
            {i.email}
            {i.phone ? ` · ${i.phone}` : ""}
            {i.company ? ` · ${i.company}` : ""}
          </p>
        </div>
        <InquiryStatusBadge status={i.status} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <AdminCard title="문의 내용" className="lg:col-span-2">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field label="서비스" value={i.service_type ?? "—"} />
            <Field label="예산" value={i.budget_range ?? "—"} />
            <Field label="유입" value={i.source} />
            <Field label="접수" value={format(new Date(i.created_at), "yyyy-MM-dd HH:mm")} />
          </dl>
          <div className="mt-4 rounded-lg border border-ink-15 bg-ink-5 px-4 py-3 text-[12.5px] leading-[1.7] text-ink-70 whitespace-pre-wrap">
            {i.message || "메시지가 없습니다."}
          </div>
        </AdminCard>

        <AdminCard title="액션">
          <InquiryActions
            id={i.id}
            currentStatus={i.status}
            defaultQuote={{
              title: i.service_type
                ? `${i.service_type} 견적`
                : `${i.name} 견적`,
              service_type: i.service_type,
            }}
          />
        </AdminCard>
      </div>

      <AdminCard title="연결된 견적">
        {qs.length === 0 ? (
          <p className="text-[12.5px] text-ink-50">아직 발행된 견적이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-ink-15">
            {qs.map((q) => (
              <li key={q.id} className="flex items-center justify-between py-3">
                <Link
                  href={`/admin/quotes/${q.id}`}
                  className="font-display text-[13px] font-bold text-ink-100 hover:text-iris"
                >
                  {q.title}
                </Link>
                <div className="flex items-center gap-3 text-[12px] text-ink-70">
                  <span className="num font-bold">
                    {new Intl.NumberFormat("ko-KR").format(q.total_price)}원
                  </span>
                  <span className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
                    {q.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </dt>
      <dd className="mt-0.5 text-[13px] text-ink-100">{value}</dd>
    </div>
  );
}
