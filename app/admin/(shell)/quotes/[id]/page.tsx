import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard } from "@/components/admin/Card";
import { QuoteStatusBadge } from "@/components/admin/Badge";
import type { Quote, QuoteOption } from "@/lib/types/db";
import { QuoteEditor } from "./QuoteEditor";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 견적 상세",
  robots: { index: false, follow: false },
};

export default async function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("quotes")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!data) notFound();
  const q = data as Quote;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href="/admin/quotes" className="hover:text-iris">
          ← 견적 목록
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
            {q.title}
          </h2>
          <p className="mt-1 text-[12px] text-ink-50">
            생성 {format(new Date(q.created_at), "yyyy-MM-dd HH:mm")}
            {q.expires_at
              ? ` · 만료 ${format(new Date(q.expires_at), "yyyy-MM-dd")}`
              : ""}
          </p>
        </div>
        <QuoteStatusBadge status={q.status} />
      </div>

      <QuoteEditor
        quote={{
          id: q.id,
          inquiry_id: q.inquiry_id,
          title: q.title,
          service_type: q.service_type,
          base_price: q.base_price,
          options: (q.options as QuoteOption[]) ?? [],
          delivery_days: q.delivery_days,
          status: q.status,
          expires_at: q.expires_at,
          total_price: q.total_price,
        }}
      />

      <AdminCard title="히스토리">
        <p className="text-[12.5px] text-ink-50">
          이 견적의 상태 변경 및 발송 기록은 대시보드 활동 로그에서 확인할 수 있습니다.
        </p>
      </AdminCard>
    </div>
  );
}
