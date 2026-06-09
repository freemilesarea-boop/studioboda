import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { PaymentOpsHealth } from "@/lib/queries/payment-ops";

type Tone = "ok" | "warn" | "danger";

const TONE_DOT: Record<Tone, string> = {
  ok: "bg-success",
  warn: "bg-warning",
  danger: "bg-error",
};
const TONE_BORDER: Record<Tone, string> = {
  ok: "border-ink-15",
  warn: "border-warning/40 bg-warning/[0.04]",
  danger: "border-error/40 bg-error/[0.05]",
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
const ago = (iso: string | null) =>
  iso ? formatDistanceToNow(new Date(iso), { locale: ko, addSuffix: true }) : "기록 없음";

function Tile({
  tone,
  label,
  value,
  detail,
  children,
}: {
  tone: Tone;
  label: string;
  value: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-3.5 ${TONE_BORDER[tone]}`}>
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} aria-hidden />
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.06em] text-ink-50">
          {label}
        </span>
      </div>
      <p className="mt-1.5 font-display text-[16px] font-extrabold text-ink-100">{value}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-ink-50">{detail}</p> : null}
      {children ? <div className="mt-2 space-y-0.5">{children}</div> : null}
    </div>
  );
}

export function PaymentOpsWidget({ health: h }: { health: PaymentOpsHealth }) {
  const webhookTone: Tone =
    h.webhookFailed24h > 0 || h.webhookUnknown24h > 0 ? "warn" : "ok";
  const reconcileTone: Tone = h.oldPendingPaymentsCount > 0 ? "warn" : "ok";
  const mismatchTone: Tone = h.paymentMismatchCount > 0 ? "danger" : "ok";
  const pendingTone: Tone = h.oldPendingPaymentsCount > 0 ? "warn" : "ok";
  const kickoffTone: Tone = h.kickoffStuckCount > 0 ? "danger" : "ok";
  const emailTone: Tone = h.emailFailed24h > 0 ? "warn" : "ok";

  return (
    <section className="rounded-2xl border border-ink-15 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[14px] font-bold text-ink-100">결제 운영 상태</h2>
        <span className="text-[11px] text-ink-50">최근 24시간 · read-only</span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. webhook */}
        <Tile
          tone={webhookTone}
          label="Webhook 수신"
          value={`완료 ${h.webhookPaid24h} · 실패 ${h.webhookFailed24h} · 미매핑 ${h.webhookUnknown24h}`}
          detail={`마지막 수신 ${ago(h.lastWebhookAt)}`}
        />

        {/* 2. reconcile */}
        <Tile
          tone={reconcileTone}
          label="Reconcile 안전망"
          value={`최근 24h 반영 ${h.reconcileApplied24h}건`}
          detail={
            h.lastReconcileAt
              ? `마지막 반영 ${ago(h.lastReconcileAt)}`
              : "반영 이력 없음 (무변경 시 미기록)"
          }
        >
          {h.oldPendingPaymentsCount > 0 ? (
            <p className="text-[11px] font-bold text-warning">
              ⚠️ 24h+ pending {h.oldPendingPaymentsCount}건 — 동기화 점검 필요
            </p>
          ) : null}
        </Tile>

        {/* 3. 결제 상태 불일치 */}
        <Tile
          tone={mismatchTone}
          label="결제 상태 불일치"
          value={h.paymentMismatchCount === 0 ? "정상 (0건)" : `${h.paymentMismatchCount}건 불일치`}
          detail={h.paymentMismatchCount > 0 ? "캐시 ≠ 실제 결제 원장" : "캐시 = 실원장"}
        >
          {h.paymentMismatches.map((m) => (
            <p key={m.quote_id} className="truncate text-[11px] text-error" title={m.title}>
              · {m.title} ({m.cached ?? "—"} → {m.ledger})
            </p>
          ))}
        </Tile>

        {/* 4. pending aging */}
        <Tile
          tone={pendingTone}
          label="Pending 적체 (24h+)"
          value={h.oldPendingPaymentsCount === 0 ? "없음" : `${h.oldPendingPaymentsCount}건`}
        >
          {h.oldPendingPayments.map((p) => (
            <p key={p.id} className="truncate text-[11px] text-ink-50" title={p.title}>
              · {p.title} · {fmt(p.amount)}원 {p.has_mul_no ? "" : "· mul_no 없음"}
            </p>
          ))}
        </Tile>

        {/* 5. 자동착수 대기 */}
        <Tile
          tone={kickoffTone}
          label="자동착수 대기"
          value={h.kickoffStuckCount === 0 ? "없음" : `${h.kickoffStuckCount}건`}
          detail={h.kickoffStuckCount > 0 ? "서명+예약금 완료인데 queued" : "kickoff 누락 없음"}
        >
          {h.kickoffStuckProjects.map((p) => (
            <p key={p.project_id} className="text-[11px] text-error">
              · {p.project_no}
            </p>
          ))}
        </Tile>

        {/* 6. 알림 발송 실패 */}
        <Tile
          tone={emailTone}
          label="알림 메일 실패 (24h)"
          value={h.emailFailed24h === 0 ? "없음" : `${h.emailFailed24h}건`}
        >
          {h.latestEmailErrors.map((e, i) => (
            <p key={i} className="truncate text-[11px] text-warning" title={`${e.event_type} · ${e.error ?? ""}`}>
              · {e.event_type}: {e.error ?? "—"}
            </p>
          ))}
        </Tile>
      </div>
    </section>
  );
}
