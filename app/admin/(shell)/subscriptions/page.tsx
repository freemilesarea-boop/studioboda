import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { listAllSubscriptions } from "@/lib/queries/subscriptions";
import {
  subscriptionStatusLabels,
  type SubscriptionStatus,
} from "@/lib/types/db";

export const metadata: Metadata = {
  title: "Subscriptions · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

const STATUS_TONE: Record<SubscriptionStatus, string> = {
  pending_card: "bg-warning/15 text-warning",
  active: "bg-success/15 text-success",
  past_due: "bg-error/15 text-error",
  canceled: "bg-ink-5 text-ink-50",
  paused: "bg-ink-5 text-ink-70",
};

export default async function AdminSubscriptionsPage() {
  const subs = await listAllSubscriptions();

  const counts: Record<SubscriptionStatus, number> = {
    pending_card: 0,
    active: 0,
    past_due: 0,
    canceled: 0,
    paused: 0,
  };
  for (const s of subs) counts[s.status]++;

  const totalMonthly = subs
    .filter((s) => s.status === "active")
    .reduce((acc, s) => acc + s.monthly_amount, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-iris">
            Subscriptions
          </p>
          <h1 className="mt-1 font-display text-[24px] font-extrabold tracking-tightish text-ink-100">
            정기 구독
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-50">
            매월 자동 결제. 7회 연속 실패 시 자동 해지됩니다.
          </p>
        </div>
        <Link
          href="/admin/subscriptions/new"
          className="inline-flex h-10 items-center gap-1 rounded-lg bg-ink-100 px-4 font-display text-[12.5px] font-bold text-white hover:bg-ink-90"
        >
          <i className="ti ti-plus text-[14px]" aria-hidden />
          새 구독 등록
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Active" value={counts.active} tone="text-success" />
        <Stat
          label="Pending card"
          value={counts.pending_card}
          tone="text-warning"
        />
        <Stat label="Past due" value={counts.past_due} tone="text-error" />
        <Stat label="Paused" value={counts.paused} tone="text-ink-100" />
        <Stat label="Canceled" value={counts.canceled} tone="text-ink-50" />
      </section>

      <section className="rounded-2xl border border-ink-15 bg-white p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
          MRR (활성 구독 기준)
        </p>
        <p className="num mt-1 font-display text-[28px] font-extrabold text-ink-100">
          {fmt(totalMonthly)}원 <span className="text-[13px] font-normal text-ink-50">/ 월</span>
        </p>
      </section>

      <section className="rounded-2xl border border-ink-15 bg-white">
        <table className="w-full text-[12.5px]">
          <thead className="bg-ink-5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
            <tr>
              <th className="px-4 py-3 text-left">상태</th>
              <th className="px-4 py-3 text-left">고객</th>
              <th className="px-4 py-3 text-left">플랜</th>
              <th className="px-4 py-3 text-right">월 금액</th>
              <th className="px-4 py-3 text-left">다음 결제일</th>
              <th className="px-4 py-3 text-left">시작일</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-15">
            {subs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-50">
                  구독 데이터가 없습니다
                </td>
              </tr>
            ) : (
              subs.map((s) => (
                <tr key={s.id} className="hover:bg-ink-5">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_TONE[s.status]}`}
                    >
                      {subscriptionStatusLabels[s.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-ink-100">
                      {s.profile_name ?? "—"}
                    </p>
                    <p className="text-[11px] text-ink-50">
                      {s.profile_email ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-bold text-ink-100">
                    {s.plan_name}
                  </td>
                  <td className="num px-4 py-3 text-right font-bold text-ink-100">
                    {fmt(s.monthly_amount)}원
                  </td>
                  <td className="px-4 py-3 text-ink-70">
                    {s.next_charge_at
                      ? format(new Date(s.next_charge_at), "yyyy-MM-dd")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-70">
                    {s.started_at
                      ? format(new Date(s.started_at), "yyyy-MM-dd")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/subscriptions/${s.id}`}
                      className="text-[12px] font-bold text-iris hover:underline"
                    >
                      열기 →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-15 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </p>
      <p className={`num mt-1 font-display text-[24px] font-extrabold ${tone}`}>
        {value}
      </p>
    </div>
  );
}
