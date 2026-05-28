import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AdminCard, EmptyState, StatCard } from "@/components/admin/Card";
import { listAllPayments, paymentAggregates } from "@/lib/queries/payments";
import {
  paymentStatusLabels,
  paymentTypeLabels,
  type PaymentStatus,
} from "@/lib/types/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Payments",
  robots: { index: false, follow: false },
};

const STATUS_TABS: (PaymentStatus | "all")[] = [
  "all",
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
];

const TONE: Record<PaymentStatus, string> = {
  pending: "bg-warning/15 text-warning",
  paid: "bg-success/15 text-success",
  failed: "bg-error/15 text-error",
  cancelled: "bg-ink-5 text-ink-70",
  refunded: "bg-ink-5 text-ink-70",
};
const TYPE_TONE = {
  deposit: "bg-iris/15 text-iris",
  balance: "bg-sky/15 text-sky",
  extra: "bg-warning/15 text-warning",
} as const;

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = (
    STATUS_TABS.includes(searchParams.status as PaymentStatus | "all")
      ? searchParams.status
      : "all"
  ) as PaymentStatus | "all";

  const [rows, agg] = await Promise.all([
    listAllPayments(status === "all" ? undefined : status),
    paymentAggregates(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
            Payments
          </p>
          <h2 className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.4px] text-ink-100">
            결제 관리
          </h2>
        </div>
        <Link
          href="/admin/payments/new"
          className="inline-flex h-10 items-center rounded-lg bg-ink-100 px-4 font-display text-[12.5px] font-bold text-white hover:bg-ink-90"
        >
          + 결제 청구 생성
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="미수금 합계" value={`${fmt(agg.unpaidTotal)}원`} tone="warning" />
        <StatCard
          label="대기 중 예약금"
          value={`${fmt(agg.pendingDeposits)}원`}
          tone="iris"
        />
        <StatCard
          label="결제 완료 합계"
          value={`${fmt(agg.paidTotal)}원`}
          tone="success"
        />
        <StatCard label="대기 / 완료 건수" value={`${agg.pendingCount} / ${agg.paidCount}`} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_TABS.map((s) => {
          const active = s === status;
          return (
            <Link
              key={s}
              href={`/admin/payments${s === "all" ? "" : `?status=${s}`}`}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
                active
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              {s === "all" ? "전체" : paymentStatusLabels[s as PaymentStatus]}
            </Link>
          );
        })}
      </div>

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyState
            icon="ti-credit-card-off"
            title="조회된 결제가 없습니다"
            description="견적이 생성된 후 결제 청구를 발행할 수 있습니다."
          />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="min-w-full text-left text-[12.5px]">
              <thead className="border-b border-ink-15 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
                <tr>
                  <th className="px-5 py-2.5">유형</th>
                  <th className="px-3 py-2.5">제목</th>
                  <th className="px-3 py-2.5 text-right">금액</th>
                  <th className="px-3 py-2.5">상태</th>
                  <th className="px-3 py-2.5">결제 링크</th>
                  <th className="px-5 py-2.5 text-right">생성</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-15">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-ink-5">
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] ${TYPE_TONE[p.type]}`}
                      >
                        {paymentTypeLabels[p.type]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-display font-bold text-ink-100">
                        {p.title}
                      </p>
                      {p.description ? (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-50">
                          {p.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="num px-3 py-3 text-right font-bold text-ink-100">
                      {fmt(p.amount)}원
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] ${TONE[p.status]}`}
                      >
                        {paymentStatusLabels[p.status]}
                      </span>
                      {p.paid_at ? (
                        <p className="mt-0.5 text-[10px] text-ink-50">
                          {format(new Date(p.paid_at), "yyyy-MM-dd HH:mm")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-[11.5px]">
                      {p.payapp_payurl ? (
                        <a
                          href={p.payapp_payurl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-iris hover:underline"
                        >
                          PayApp 링크 ↗
                        </a>
                      ) : (
                        <span className="text-ink-50">—</span>
                      )}
                      {p.payapp_mul_no ? (
                        <p className="mt-0.5 font-mono text-[10px] text-ink-50">
                          {p.payapp_mul_no}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-right text-[11px] text-ink-50">
                      {formatDistanceToNow(new Date(p.created_at), {
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
    </div>
  );
}
