import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard } from "@/components/admin/Card";
import { QuotePaymentPanel } from "./QuotePaymentPanel";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { QuoteStatusBadge } from "@/components/admin/Badge";
import type { Quote, QuoteOption } from "@/lib/types/db";
import { QuoteEditor } from "./QuoteEditor";
import { QuoteContractButton } from "./QuoteContractButton";
import { resolveQuoteBuyer } from "@/lib/queries/buyer";

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

  const { data: paymentsRows } = await admin
    .from("payments")
    .select("*")
    .eq("quote_id", q.id)
    .order("created_at", { ascending: false });
  const payments = (paymentsRows ?? []) as {
    id: string;
    type: "deposit" | "balance" | "extra";
    title: string;
    amount: number;
    status: string;
    payapp_payurl: string | null;
    payapp_mul_no: string | null;
    paid_at: string | null;
    created_at: string;
  }[];

  const depositRate = q.deposit_rate ?? 10;
  const depositAmount =
    q.deposit_amount ?? Math.round((q.total_price * depositRate) / 100);
  const balanceAmount = q.balance_amount ?? q.total_price - depositAmount;

  const buyer = await resolveQuoteBuyer(q.id);

  const { data: existingContract } = await admin
    .from("contracts")
    .select("id")
    .eq("quote_id", q.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 text-[12px]">
        <Link href="/admin/quotes" className="text-ink-50 hover:text-iris">
          ← 견적 목록
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/quotes/${q.id}/brief`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-iris/30 bg-iris/10 px-3 font-display text-[12px] font-bold text-iris hover:bg-iris/15"
          >
            <i className="ti ti-sparkles text-[14px]" aria-hidden />
            AI 브리프
          </Link>
          <QuoteContractButton
            quoteId={q.id}
            existingContractId={(existingContract as { id: string } | null)?.id ?? null}
          />
          <Link
            href={`/admin/print/quote/${q.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-lg border border-ink-15 bg-white px-3 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
          >
            ⤓ 견적서 PDF/인쇄
          </Link>
        </div>
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

      <QuotePaymentPanel
        quote={{
          id: q.id,
          title: q.title,
          total_price: q.total_price,
          deposit_rate: depositRate,
          deposit_amount: depositAmount,
          balance_amount: balanceAmount,
          payment_status: q.payment_status,
        }}
        payments={payments}
        buyer={buyer}
      />

      <AdminCard title="활동 타임라인">
        <ActivityTimeline
          entityType="quote"
          entityId={q.id}
          limit={30}
          showRawAction
        />
      </AdminCard>
    </div>
  );
}
