import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { requireStaff } from "@/lib/auth";
import { executiveKpis } from "@/lib/queries/kpi";
import { StatCard } from "@/components/admin/Card";
import { LineSparkline, BarChart } from "@/components/admin/MiniChart";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 대시보드",
  robots: { index: false, follow: false },
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
const won = (n: number) =>
  n >= 100000000
    ? `${(n / 100000000).toFixed(1)}억`
    : n >= 10000
      ? `${Math.round(n / 10000)}만원`
      : `${fmt(n)}원`;

const KIND_META: Record<string, { icon: string; tone: string }> = {
  inquiry: { icon: "ti-message-dots", tone: "text-iris" },
  quote: { icon: "ti-file-invoice", tone: "text-sky" },
  contract: { icon: "ti-file-text", tone: "text-warning" },
  payment: { icon: "ti-credit-card", tone: "text-success" },
  project: { icon: "ti-rocket", tone: "text-ink-70" },
};

export default async function ExecutiveDashboardPage() {
  await requireStaff();
  const k = await executiveKpis();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-[20px] font-extrabold tracking-tightish text-ink-100">
          대표 대시보드
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-50">
          영업 · 계약 · 매출 핵심 지표를 한 화면에서 확인합니다.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="오늘 문의" value={k.inquiriesToday} tone="iris" />
        <StatCard label="이번달 문의" value={k.inquiriesThisMonth} />
        <StatCard label="이번달 견적" value={k.quotesThisMonth} />
        <StatCard label="진행중 프로젝트" value={k.activeProjects} />
        <StatCard
          label="계약 전환율"
          value={`${k.contractConversion}%`}
          tone="success"
          trend="서명 완료 / 발송 계약"
        />
        <StatCard
          label="결제 전환율"
          value={`${k.paymentConversion}%`}
          tone="warning"
          trend="수락 견적 / 전체 견적"
        />
        <StatCard label="이번달 매출" value={won(k.revenueThisMonth)} tone="iris" />
        <StatCard label="누적 매출" value={won(k.revenueTotal)} />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <LineSparkline
          label="문의 추이 (6개월)"
          data={k.inquiryTrend.map((m) => ({ day: m.month.slice(5), amount: m.count }))}
          trailingValue={`${k.inquiriesThisMonth}건`}
        />
        <LineSparkline
          label="매출 추이 (6개월)"
          color="#4ADE80"
          data={k.revenueTrend.map((m) => ({ day: m.month.slice(5), amount: m.amount }))}
          trailingValue={won(k.revenueThisMonth)}
        />
        <BarChart
          label="계약 전환율 추이 (%)"
          rows={k.contractTrend.map((m) => ({ key: m.month.slice(5), value: m.rate }))}
          formatValue={(n) => `${n}%`}
        />
      </section>

      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[14px] font-bold text-ink-100">
          최근 활동
        </h2>
        <p className="mt-0.5 text-[11px] text-ink-50">
          문의 · 견적 · 계약 · 결제 · 프로젝트 통합 타임라인
        </p>
        {k.recent.length === 0 ? (
          <p className="mt-4 text-[12.5px] text-ink-50">활동 기록이 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-1.5">
            {k.recent.map((r) => {
              const meta = KIND_META[r.kind] ?? KIND_META.inquiry;
              return (
                <li
                  key={`${r.kind}-${r.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-5"
                >
                  <i className={`ti ${meta.icon} text-[15px] ${meta.tone}`} aria-hidden />
                  <span className="flex-1 truncate text-[12.5px] text-ink-70">
                    {r.label}
                  </span>
                  <span className="shrink-0 text-[10.5px] text-ink-50">
                    {formatDistanceToNow(new Date(r.at), { locale: ko, addSuffix: true })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
