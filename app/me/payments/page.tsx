import type { Metadata } from "next";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { getProfile } from "@/lib/auth";
import { listMyPayments } from "@/lib/queries/payments";
import {
  paymentStatusLabels,
  paymentTypeLabels,
  type Payment,
  type PaymentStatus,
  type PaymentType,
} from "@/lib/types/db";

export const metadata: Metadata = {
  title: "결제",
  robots: { index: false, follow: false },
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

const STATUS_TONE: Record<PaymentStatus, string> = {
  pending: "bg-warning/15 text-warning",
  paid: "bg-success/15 text-success",
  failed: "bg-error/15 text-error",
  cancelled: "bg-ink-5 text-ink-70",
  refunded: "bg-ink-5 text-ink-70",
};

const TYPE_TONE: Record<PaymentType, string> = {
  deposit: "bg-iris/15 text-iris",
  balance: "bg-sky/15 text-sky",
  extra: "bg-warning/15 text-warning",
};

export default async function MyPaymentsPage({
  searchParams,
}: {
  searchParams: { return?: string };
}) {
  const me = await getProfile();
  if (!me) return null;
  const payments = await listMyPayments(me.id);

  const pending = payments.filter((p) => p.status === "pending");
  const paid = payments.filter((p) => p.status === "paid");
  const others = payments.filter(
    (p) => !["pending", "paid"].includes(p.status),
  );

  return (
    <div className="space-y-6">
      {searchParams.return === "1" ? (
        <div className="rounded-2xl border border-iris/30 bg-iris-light px-5 py-4 text-[13px] text-iris">
          결제를 처리하고 있습니다. 결제 결과는 자동으로 반영되며, 잠시 후
          새로고침하면 상태가 업데이트됩니다.
        </div>
      ) : null}

      <header>
        <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
          Payments
        </p>
        <h1 className="mt-1 font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
          결제
          <span className="num ml-1.5 text-[13px] font-bold text-ink-50">
            {payments.length}
          </span>
        </h1>
        <p className="mt-1 text-[12px] text-ink-50">
          예약금·본결제·추가결제는 운영팀이 발행한 청구 기준으로 처리됩니다. 금액은
          청구 시점에 고정됩니다.
        </p>
      </header>

      <Group
        title="결제 대기"
        count={pending.length}
        empty="결제할 청구가 없습니다."
        payments={pending}
        showPayButton
      />

      <Group
        title="완료된 결제"
        count={paid.length}
        empty="완료된 결제가 아직 없습니다."
        payments={paid}
      />

      {others.length > 0 ? (
        <Group
          title="기타 (실패 · 취소 · 환불)"
          count={others.length}
          empty=""
          payments={others}
        />
      ) : null}
    </div>
  );
}

function Group({
  title,
  count,
  empty,
  payments,
  showPayButton,
}: {
  title: string;
  count: number;
  empty: string;
  payments: Payment[];
  showPayButton?: boolean;
}) {
  return (
    <section>
      <header className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-[14px] font-bold tracking-tightish text-ink-100">
          {title}{" "}
          <span className="num ml-1 text-[12px] font-bold text-ink-50">
            {count}
          </span>
        </h2>
      </header>
      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-8 text-center">
          <p className="text-[12.5px] text-ink-50">{empty}</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {payments.map((p) => (
            <PaymentCard key={p.id} p={p} showPayButton={showPayButton} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PaymentCard({
  p,
  showPayButton,
}: {
  p: Payment;
  showPayButton?: boolean;
}) {
  return (
    <li className="rounded-2xl border border-ink-15 bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption ${TYPE_TONE[p.type]}`}
            >
              {paymentTypeLabels[p.type]}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption ${STATUS_TONE[p.status]}`}
            >
              {paymentStatusLabels[p.status]}
            </span>
          </div>
          <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
            {p.title}
          </p>
          {p.description ? (
            <p className="mt-0.5 text-[12px] leading-body text-ink-70">
              {p.description}
            </p>
          ) : null}
          <p className="mt-1.5 text-[11px] text-ink-50">
            {p.status === "paid" && p.paid_at
              ? `결제 ${format(new Date(p.paid_at), "yyyy-MM-dd HH:mm")}`
              : `발행 ${formatDistanceToNow(new Date(p.created_at), {
                  locale: ko,
                  addSuffix: true,
                })}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="num font-display text-[20px] font-extrabold tracking-tightish text-ink-100">
            {new Intl.NumberFormat("ko-KR").format(p.amount)}원
          </p>
          {showPayButton && p.status === "pending" && p.payapp_payurl ? (
            <a
              href={p.payapp_payurl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-lg bg-iris px-5 font-display text-[12.5px] font-bold text-white hover:opacity-90"
            >
              결제하기 →
            </a>
          ) : null}
          {p.status === "pending" && !p.payapp_payurl ? (
            <p className="text-[11px] text-warning">결제 링크 발급 중</p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
