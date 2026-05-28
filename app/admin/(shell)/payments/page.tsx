import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard, EmptyState, StatCard } from "@/components/admin/Card";
import { paymentAggregates } from "@/lib/queries/payments";
import {
  paymentStatusLabels,
  paymentTypeLabels,
  type Payment,
  type PaymentStatus,
  type PaymentType,
} from "@/lib/types/db";
import { RefundButton } from "./RefundButton";

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
const TYPE_TABS: (PaymentType | "all")[] = ["all", "deposit", "balance", "extra"];

const TONE: Record<PaymentStatus, string> = {
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

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

function buildLink(
  base: string,
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
) {
  const next = { ...current, ...patch };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v && v !== "all") sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; from?: string; to?: string };
}) {
  const status = (
    STATUS_TABS.includes(searchParams.status as PaymentStatus | "all")
      ? searchParams.status
      : "all"
  ) as PaymentStatus | "all";
  const type = (
    TYPE_TABS.includes(searchParams.type as PaymentType | "all")
      ? searchParams.type
      : "all"
  ) as PaymentType | "all";
  const from = searchParams.from ?? "";
  const to = searchParams.to ?? "";

  const admin = createAdminSupabase();
  let q = admin
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (status !== "all") q = q.eq("status", status);
  if (type !== "all") q = q.eq("type", type);
  if (from) q = q.gte("created_at", `${from}T00:00:00Z`);
  if (to) q = q.lte("created_at", `${to}T23:59:59Z`);

  const [rowsRes, agg] = await Promise.all([q, paymentAggregates()]);
  const rows = (rowsRes.data ?? []) as Payment[];

  // Monthly subtotal grouped by YYYY-MM of paid_at (fallback created_at)
  const monthlyMap: Record<string, { paid: number; pending: number; count: number }> = {};
  for (const r of rows) {
    const key = (r.paid_at ?? r.created_at).slice(0, 7);
    monthlyMap[key] = monthlyMap[key] ?? { paid: 0, pending: 0, count: 0 };
    monthlyMap[key].count += 1;
    if (r.status === "paid") monthlyMap[key].paid += r.amount ?? 0;
    if (r.status === "pending") monthlyMap[key].pending += r.amount ?? 0;
  }
  const monthly = Object.entries(monthlyMap)
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => b.month.localeCompare(a.month));

  const current = { status, type, from: from || undefined, to: to || undefined };

  const csvHref = (() => {
    const sp = new URLSearchParams();
    if (status !== "all") sp.set("status", status);
    if (type !== "all") sp.set("type", type);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    const s = sp.toString();
    return `/api/admin/payments/export${s ? `?${s}` : ""}`;
  })();

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
        <div className="flex gap-2">
          <a
            href={csvHref}
            className="inline-flex h-10 items-center rounded-lg border border-ink-15 bg-white px-4 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
          >
            ⤓ CSV
          </a>
          <Link
            href="/admin/payments/new"
            className="inline-flex h-10 items-center rounded-lg bg-ink-100 px-4 font-display text-[12.5px] font-bold text-white hover:bg-ink-90"
          >
            + 결제 청구 생성
          </Link>
        </div>
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

      {/* Filter row */}
      <div className="rounded-2xl border border-ink-15 bg-white p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-2 font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
            상태
          </span>
          {STATUS_TABS.map((s) => (
            <Link
              key={s}
              href={buildLink("/admin/payments", current, { status: s })}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
                s === status
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              {s === "all" ? "전체" : paymentStatusLabels[s as PaymentStatus]}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-2 font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
            유형
          </span>
          {TYPE_TABS.map((t) => (
            <Link
              key={t}
              href={buildLink("/admin/payments", current, { type: t })}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
                t === type
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              {t === "all" ? "전체" : paymentTypeLabels[t as PaymentType]}
            </Link>
          ))}
        </div>
        <form
          method="get"
          action="/admin/payments"
          className="mt-3 flex flex-wrap items-end gap-2 text-[12px]"
        >
          {status !== "all" ? (
            <input type="hidden" name="status" value={status} />
          ) : null}
          {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
          <label className="flex flex-col">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
              From
            </span>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="h-9 rounded-md border border-ink-15 bg-white px-2 text-[12.5px] outline-none focus:border-iris/60"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
              To
            </span>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="h-9 rounded-md border border-ink-15 bg-white px-2 text-[12.5px] outline-none focus:border-iris/60"
            />
          </label>
          <button
            type="submit"
            className="h-9 rounded-md bg-ink-100 px-3 font-display text-[12px] font-bold text-white hover:bg-ink-90"
          >
            적용
          </button>
          {(from || to) && (
            <Link
              href={buildLink("/admin/payments", current, {
                from: undefined,
                to: undefined,
              })}
              className="h-9 inline-flex items-center rounded-md border border-ink-15 px-3 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30"
            >
              날짜 초기화
            </Link>
          )}
        </form>
      </div>

      {monthly.length > 0 ? (
        <AdminCard title="월별 합계">
          <div className="-mx-5 overflow-x-auto">
            <table className="min-w-full text-left text-[12.5px]">
              <thead className="border-b border-ink-15 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
                <tr>
                  <th className="px-5 py-2.5">월</th>
                  <th className="px-3 py-2.5 text-right">결제 완료</th>
                  <th className="px-3 py-2.5 text-right">대기</th>
                  <th className="px-3 py-2.5 text-right">총 건수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-15">
                {monthly.map((m) => (
                  <tr key={m.month}>
                    <td className="px-5 py-3 font-display font-bold text-ink-100">
                      {m.month}
                    </td>
                    <td className="num px-3 py-3 text-right font-bold text-success">
                      {fmt(m.paid)}원
                    </td>
                    <td className="num px-3 py-3 text-right text-warning">
                      {fmt(m.pending)}원
                    </td>
                    <td className="num px-3 py-3 text-right text-ink-70">
                      {m.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      ) : null}

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyState
            icon="ti-credit-card-off"
            title="조회된 결제가 없습니다"
            description="필터를 조정하거나 새 결제 청구를 발행하세요."
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
                  <th className="px-3 py-2.5 text-right">생성</th>
                  <th className="px-5 py-2.5 text-right">액션</th>
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
                          paid {format(new Date(p.paid_at), "yyyy-MM-dd HH:mm")}
                        </p>
                      ) : null}
                      {p.refunded_at ? (
                        <p className="mt-0.5 text-[10px] text-ink-50">
                          refunded {format(new Date(p.refunded_at), "yyyy-MM-dd")}
                        </p>
                      ) : null}
                      {p.refund_reason ? (
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-error">
                          {p.refund_reason}
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
                    <td className="px-3 py-3 text-right text-[11px] text-ink-50">
                      {formatDistanceToNow(new Date(p.created_at), {
                        locale: ko,
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <RefundButton
                        paymentId={p.id}
                        status={p.status}
                        amount={p.amount}
                      />
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
