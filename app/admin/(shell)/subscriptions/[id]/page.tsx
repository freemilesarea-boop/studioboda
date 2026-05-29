import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { getSubscriptionAdmin } from "@/lib/queries/subscriptions";
import {
  subscriptionStatusLabels,
  subscriptionInvoiceStatusLabels,
  type SubscriptionInvoice,
  type SubscriptionInvoiceStatus,
  type SubscriptionStatus,
} from "@/lib/types/db";
import { AdminSubscriptionActions } from "./AdminSubscriptionActions";

export const metadata: Metadata = {
  title: "구독 상세 · Admin",
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

export default async function AdminSubscriptionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getSubscriptionAdmin(params.id);
  if (!data) notFound();
  const { subscription: s, invoices } = data;

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/admin/subscriptions"
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
            <p className="mt-1 text-[12.5px] text-ink-50">
              {s.profile_name ?? "—"} · {s.profile_email ?? "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="num font-display text-[24px] font-extrabold tracking-tightish text-ink-100">
              {fmt(s.monthly_amount)}원
            </p>
            <p className="text-[11px] text-ink-50">/ 월</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-ink-15 pt-4 text-[12.5px] sm:grid-cols-3">
          <Row label="플랜 식별자">{s.plan_key}</Row>
          {s.next_charge_at ? (
            <Row label="다음 결제일">
              {format(new Date(s.next_charge_at), "yyyy-MM-dd")}
            </Row>
          ) : null}
          {s.started_at ? (
            <Row label="시작일">
              {format(new Date(s.started_at), "yyyy-MM-dd")}
            </Row>
          ) : null}
          {s.current_period_start ? (
            <Row label="이번 기간">
              {format(new Date(s.current_period_start), "yyyy-MM-dd")} ~{" "}
              {s.current_period_end
                ? format(new Date(s.current_period_end), "yyyy-MM-dd")
                : "—"}
            </Row>
          ) : null}
          <Row label="실패 재시도 횟수">
            {s.retry_count} / 7
          </Row>
          {s.last_failure_reason ? (
            <Row label="최근 실패 사유">
              <span className="text-error">{s.last_failure_reason}</span>
            </Row>
          ) : null}
          {s.canceled_at ? (
            <Row label="해지일">
              {format(new Date(s.canceled_at), "yyyy-MM-dd HH:mm")} (
              {s.canceled_by_actor ?? "—"})
            </Row>
          ) : null}
          {s.canceled_reason ? (
            <Row label="해지 사유">{s.canceled_reason}</Row>
          ) : null}
          {s.payapp_billing_key ? (
            <Row label="PayApp 빌링키">
              <code className="font-mono text-[11px] text-ink-70">
                {s.payapp_billing_key}
              </code>
            </Row>
          ) : null}
        </dl>

        <div className="mt-6 border-t border-ink-15 pt-4">
          <AdminSubscriptionActions
            subscriptionId={s.id}
            status={s.status}
            registrationUrl={s.payapp_registration_url}
          />
        </div>
      </header>

      {s.staff_notes ? (
        <section className="rounded-2xl border border-ink-15 bg-ink-5 p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
            Staff Notes (내부)
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[12.5px] text-ink-100">
            {s.staff_notes}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-ink-15 bg-white p-5 sm:p-6">
        <h2 className="font-display text-[15px] font-bold text-ink-100">
          청구 내역
        </h2>
        <p className="mt-1 text-[12.5px] text-ink-50">
          자동 청구 + 수동 청구 이력입니다.
        </p>
        <div className="mt-5">
          {invoices.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-15 px-4 py-6 text-center text-[12px] text-ink-50">
              아직 청구 내역이 없습니다
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
  const when = inv.charged_at ?? inv.failed_at ?? inv.created_at;
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
        {inv.payapp_mul_no ? (
          <p className="mt-1 font-mono text-[11px] text-ink-50">
            mul_no: {inv.payapp_mul_no}
          </p>
        ) : null}
      </div>
      <p className="num font-display text-[15px] font-extrabold text-ink-100">
        {fmt(inv.amount)}원
      </p>
    </li>
  );
}
