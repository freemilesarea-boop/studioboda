import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { listMySubscriptions } from "@/lib/queries/subscriptions";
import {
  subscriptionStatusLabels,
  type Subscription,
  type SubscriptionStatus,
} from "@/lib/types/db";

export const metadata: Metadata = {
  title: "구독",
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

export default async function MySubscriptionsPage() {
  const me = await getProfile();
  if (!me) redirect("/login");
  const subs = await listMySubscriptions(me.id);
  const active = subs.filter((s) =>
    ["pending_card", "active", "past_due", "paused"].includes(s.status),
  );
  const ended = subs.filter((s) => s.status === "canceled");

  return (
    <div className="space-y-6">
      <header>
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-iris">
          Subscriptions
        </p>
        <h1 className="mt-1 font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
          구독
          <span className="num ml-1.5 text-[13px] font-bold text-ink-50">
            {subs.length}
          </span>
        </h1>
        <p className="mt-1 text-[12px] text-ink-50">
          매월 자동 결제됩니다. 카드 등록 후부터 매월 같은 날짜에 청구되며 결제 실패가
          7회 연속되면 자동 해지됩니다.
        </p>
      </header>

      {active.length === 0 && ended.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-10 text-center">
          <p className="font-display text-[14px] font-bold text-ink-100">
            아직 구독이 없습니다
          </p>
          <p className="mt-1 text-[12px] text-ink-50">
            정기 구독은 문의 후 운영팀이 카드 등록 링크를 발송해 드립니다.
          </p>
          <Link
            href="/#inquiry"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-ink-100 px-5 font-display text-[12.5px] font-bold text-white hover:bg-ink-90"
          >
            구독 문의하기 →
          </Link>
        </div>
      ) : null}

      {active.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-[14px] font-bold text-ink-100">
            진행 중 ·{" "}
            <span className="num text-[12px] text-ink-50">{active.length}</span>
          </h2>
          <ul className="space-y-2.5">
            {active.map((s) => (
              <SubCard key={s.id} s={s} />
            ))}
          </ul>
        </section>
      ) : null}

      {ended.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-[14px] font-bold text-ink-100">
            해지된 구독 ·{" "}
            <span className="num text-[12px] text-ink-50">{ended.length}</span>
          </h2>
          <ul className="space-y-2.5">
            {ended.map((s) => (
              <SubCard key={s.id} s={s} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SubCard({ s }: { s: Subscription }) {
  return (
    <li>
      <Link
        href={`/me/subscriptions/${s.id}`}
        className="block rounded-2xl border border-ink-15 bg-white px-4 py-4 transition-colors hover:border-iris/60 sm:px-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_TONE[s.status]}`}
              >
                {subscriptionStatusLabels[s.status]}
              </span>
            </div>
            <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
              {s.plan_name}
            </p>
            <p className="mt-0.5 text-[12px] leading-body text-ink-70">
              매월 {fmt(s.monthly_amount)}원
            </p>
            {s.next_charge_at && s.status === "active" ? (
              <p className="mt-1 text-[11px] text-ink-50">
                다음 결제: {format(new Date(s.next_charge_at), "yyyy-MM-dd")}
              </p>
            ) : null}
            {s.status === "pending_card" ? (
              <p className="mt-1 text-[11px] text-warning">
                카드 등록을 완료하면 구독이 활성화됩니다
              </p>
            ) : null}
            {s.status === "past_due" ? (
              <p className="mt-1 text-[11px] text-error">
                결제가 실패했습니다. {s.retry_count}회 재시도 중
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="num font-display text-[20px] font-extrabold tracking-tightish text-ink-100">
              {fmt(s.monthly_amount)}원
            </p>
            <p className="text-[11px] text-ink-50">/ 월</p>
          </div>
        </div>
      </Link>
    </li>
  );
}
