import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getMySubscription } from "@/lib/queries/subscriptions";
import {
  subscriptionStatusLabels,
  subscriptionInvoiceStatusLabels,
  type SubscriptionInvoice,
  type SubscriptionInvoiceStatus,
  type SubscriptionStatus,
} from "@/lib/types/db";
import { CancelSubscriptionForm } from "./CancelSubscriptionForm";

export const metadata: Metadata = {
  title: "구독 상세",
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

const INVOICE_TONE: Record<SubscriptionInvoiceStatus, string> = {
  pending: "bg-warning/15 text-warning",
  paid: "bg-success/15 text-success",
  failed: "bg-error/15 text-error",
  canceled: "bg-ink-5 text-ink-50",
};

export default async function MySubscriptionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getProfile();
  if (!me) redirect("/login");
  const data = await getMySubscription(me.id, params.id);
  if (!data) notFound();
  const { subscription: s, invoices } = data;

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/me/subscriptions"
          className="text-[12px] font-bold text-ink-50 hover:text-ink-100"
        >
          ← 구독 목록
        </Link>
      </p>

      <header className="rounded-2xl border border-ink-15 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_TONE[s.status]}`}
            >
              {subscriptionStatusLabels[s.status]}
            </span>
            <h1 className="mt-2 font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
              {s.plan_name}
            </h1>
            {s.description ? (
              <p className="mt-1 text-[13px] text-ink-70">{s.description}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="num font-display text-[24px] font-extrabold tracking-tightish text-ink-100">
              {fmt(s.monthly_amount)}원
            </p>
            <p className="text-[11px] text-ink-50">/ 월</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-ink-15 pt-4 text-[12.5px] sm:grid-cols-2">
          {s.next_charge_at && s.status !== "canceled" ? (
            <Row label="다음 결제일">
              {format(new Date(s.next_charge_at), "yyyy-MM-dd")}
            </Row>
          ) : null}
          {s.started_at ? (
            <Row label="시작일">
              {format(new Date(s.started_at), "yyyy-MM-dd")}
            </Row>
          ) : null}
          {s.canceled_at ? (
            <Row label="해지일">
              {format(new Date(s.canceled_at), "yyyy-MM-dd")}
            </Row>
          ) : null}
          {s.canceled_reason ? (
            <Row label="해지 사유">{s.canceled_reason}</Row>
          ) : null}
        </dl>

        {s.status === "pending_card" && s.payapp_registration_url ? (
          <div className="mt-5 rounded-xl border border-warning/30 bg-warning/[0.06] p-4">
            <p className="text-[12.5px] font-bold text-warning">
              카드 등록을 완료해주세요
            </p>
            <p className="mt-1 text-[12px] text-ink-70">
              아래 링크로 이동해 카드 정보를 입력하시면 구독이 활성화되고 첫 달
              결제가 즉시 진행됩니다.
            </p>
            <a
              href={s.payapp_registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-10 items-center rounded-lg bg-warning px-5 font-display text-[12.5px] font-bold text-white hover:opacity-90"
            >
              카드 등록 페이지 열기 →
            </a>
          </div>
        ) : null}

        {s.status === "past_due" ? (
          <div className="mt-5 rounded-xl border border-error/30 bg-error/[0.06] p-4 text-[12px] text-error/90">
            결제가 실패해 자동 재시도 중입니다 ({s.retry_count}/7).
            카드 한도 또는 등록 정보를 확인해 주세요. 7회 연속 실패 시 구독이
            자동 해지됩니다.
          </div>
        ) : null}
      </header>

      <section className="rounded-2xl border border-ink-15 bg-white p-5 sm:p-6">
        <h2 className="font-display text-[15px] font-bold text-ink-100">
          결제 내역
        </h2>
        <p className="mt-1 text-[12.5px] text-ink-50">
          매월 자동 결제된 청구 기록입니다.
        </p>
        <div className="mt-5">
          {invoices.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-15 px-4 py-6 text-center text-[12px] text-ink-50">
              아직 결제 내역이 없습니다
            </p>
          ) : (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <InvoiceRow key={inv.id} inv={inv} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {s.status !== "canceled" ? (
        <section className="rounded-2xl border border-error/30 bg-error/[0.04] p-5 sm:p-6">
          <h2 className="font-display text-[15px] font-bold text-error">
            구독 해지
          </h2>
          <p className="mt-1 text-[12.5px] text-error/80">
            해지하면 다음 결제일부터 청구되지 않습니다. 현재 결제된 이용 기간은
            끝까지 사용하실 수 있습니다.
          </p>
          <div className="mt-5">
            <CancelSubscriptionForm subscriptionId={s.id} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </dt>
      <dd className="mt-1 text-[13px] text-ink-100">{children}</dd>
    </div>
  );
}

function InvoiceRow({ inv }: { inv: SubscriptionInvoice }) {
  const when =
    inv.charged_at ?? inv.failed_at ?? inv.created_at;
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-15 px-4 py-3">
      <div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] ${INVOICE_TONE[inv.status]}`}
          >
            {subscriptionInvoiceStatusLabels[inv.status]}
          </span>
          {inv.attempt_number > 1 ? (
            <span className="text-[10px] font-semibold text-ink-50">
              재시도 #{inv.attempt_number}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[12px] text-ink-50">
          {format(new Date(when), "yyyy-MM-dd HH:mm")}
        </p>
        {inv.failure_reason ? (
          <p className="mt-1 text-[11.5px] text-error/80">
            사유: {inv.failure_reason}
          </p>
        ) : null}
      </div>
      <p className="num font-display text-[15px] font-extrabold text-ink-100">
        {fmt(inv.amount)}원
      </p>
    </li>
  );
}
