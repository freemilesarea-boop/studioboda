import Link from "next/link";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { NewPaymentForm } from "./NewPaymentForm";
import type { Quote, QuotePaymentStatus } from "@/lib/types/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 결제 청구 생성",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<QuotePaymentStatus, string> = {
  unpaid: "미결제",
  deposit_paid: "예약금 완료",
  fully_paid: "전체 완료",
};

export default async function NewPaymentPage() {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("quotes")
    .select("*")
    .in("status", ["sent", "customer_review", "accepted"])
    .order("created_at", { ascending: false })
    .limit(100);
  const quotes = (data ?? []) as Quote[];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href="/admin/payments" className="hover:text-iris">
          ← 결제 목록
        </Link>
      </div>

      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
          New payment
        </p>
        <h1 className="mt-1 font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
          결제 청구 생성
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-50">
          견적 기준으로 예약금·본결제·추가결제를 생성합니다. 금액은 서버에서 자동 계산되며
          고객의 마이페이지에 즉시 노출됩니다.
        </p>
      </header>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white p-10 text-center">
          <p className="font-display text-[13px] font-bold text-ink-100">
            결제 청구 가능한 견적이 없습니다
          </p>
          <p className="mt-1 text-[12px] text-ink-50">
            견적을 먼저 생성하고 상태를 sent / customer_review / accepted로 두세요.
          </p>
          <Link
            href="/admin/quotes"
            className="mt-4 inline-flex h-9 items-center rounded-lg bg-ink-100 px-4 font-display text-[12px] font-bold text-white"
          >
            견적 목록 →
          </Link>
        </div>
      ) : (
        <NewPaymentForm
          quotes={quotes.map((q) => ({
            id: q.id,
            title: q.title,
            service_type: q.service_type,
            total_price: q.total_price,
            deposit_rate: q.deposit_rate,
            deposit_amount: q.deposit_amount,
            balance_amount: q.balance_amount,
            payment_status_label: STATUS_LABEL[q.payment_status],
            payment_status: q.payment_status,
          }))}
        />
      )}
    </div>
  );
}
