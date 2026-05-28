import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { paymentAggregates } from "@/lib/queries/payments";
import { dashboardKpis } from "@/lib/queries/dashboard";
import {
  BarChart,
  FunnelTile,
  LineSparkline,
} from "@/components/admin/MiniChart";
import {
  paymentStatusLabels,
  projectStatusLabels,
  type PaymentStatus,
  type ProjectStatus,
} from "@/lib/types/db";
import { AdminCard, EmptyState, StatCard } from "@/components/admin/Card";
import {
  InquiryStatusBadge,
  ProjectStatusBadge,
} from "@/components/admin/Badge";
import type {
  ActivityLog,
  Inquiry,
  Project,
} from "@/lib/types/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Dashboard",
  robots: { index: false, follow: false },
};

const fmtKRW = (n: number) =>
  new Intl.NumberFormat("ko-KR").format(n) + "원";

async function loadDashboard() {
  const admin = createAdminSupabase();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    newInquiriesRes,
    activeProjectsRes,
    reviewProjectsRes,
    revenueQuotesRes,
    recentInquiriesRes,
    todayProjectsRes,
    activityRes,
  ] = await Promise.all([
    admin
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    admin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .in("status", ["briefing", "ai_draft", "designing", "revision"]),
    admin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "review"),
    admin
      .from("quotes")
      .select("total_price,status,created_at")
      .in("status", ["accepted", "sent"])
      .gte("created_at", startOfMonth.toISOString()),
    admin
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("projects")
      .select("*")
      .in("status", ["briefing", "ai_draft", "designing", "review", "revision"])
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(6),
    admin
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const acceptedRevenue = (revenueQuotesRes.data ?? [])
    .filter((q: { status: string }) => q.status === "accepted")
    .reduce((s: number, q: { total_price: number }) => s + (q.total_price ?? 0), 0);
  const pipelineRevenue = (revenueQuotesRes.data ?? [])
    .filter((q: { status: string }) => q.status === "sent")
    .reduce((s: number, q: { total_price: number }) => s + (q.total_price ?? 0), 0);

  const pay = await paymentAggregates();

  return {
    counts: {
      newInquiries: newInquiriesRes.count ?? 0,
      activeProjects: activeProjectsRes.count ?? 0,
      reviewProjects: reviewProjectsRes.count ?? 0,
    },
    revenue: {
      accepted: acceptedRevenue,
      pipeline: pipelineRevenue,
    },
    payments: pay,
    recentInquiries: (recentInquiriesRes.data ?? []) as Inquiry[],
    todayProjects: (todayProjectsRes.data ?? []) as Project[],
    activity: (activityRes.data ?? []) as ActivityLog[],
  };
}

export default async function DashboardPage() {
  const [data, kpis] = await Promise.all([loadDashboard(), dashboardKpis()]);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="신규 문의"
          value={data.counts.newInquiries}
          trend="상태=new"
          tone="iris"
        />
        <StatCard
          label="진행 중 프로젝트"
          value={data.counts.activeProjects}
          trend="브리핑·디자인·수정"
        />
        <StatCard
          label="검수 대기"
          value={data.counts.reviewProjects}
          trend="리뷰 큐"
          tone="warning"
        />
        <StatCard
          label="이번 달 예상 매출"
          value={fmtKRW(data.revenue.accepted + data.revenue.pipeline)}
          trend={`확정 ${fmtKRW(data.revenue.accepted)} · 견적발송 ${fmtKRW(
            data.revenue.pipeline,
          )}`}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="미수금 합계"
          value={fmtKRW(data.payments.unpaidTotal)}
          trend={`대기 ${data.payments.pendingCount}건`}
          tone="warning"
        />
        <StatCard
          label="대기 중 예약금"
          value={fmtKRW(data.payments.pendingDeposits)}
          trend="customer pending"
          tone="iris"
        />
        <StatCard
          label="결제 완료 합계"
          value={fmtKRW(data.payments.paidTotal)}
          trend={`완료 ${data.payments.paidCount}건`}
          tone="success"
        />
        <Link
          href="/admin/payments/new"
          className="flex flex-col justify-between rounded-2xl border border-dashed border-iris/40 bg-iris-light p-5 transition-colors hover:border-iris hover:bg-iris/[0.08]"
        >
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-iris">
            + 새 결제 청구
          </p>
          <p className="mt-2 font-display text-[15px] font-bold tracking-tightish text-ink-100">
            예약금 · 본결제 · 추가결제 발행 →
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="이번 달 매출 (확정)"
          value={fmtKRW(kpis.revenue.paidThisMonth)}
          trend="paid_at 기준"
          tone="success"
        />
        <StatCard
          label="예약금 수금 누적"
          value={fmtKRW(kpis.revenue.depositPaidTotal)}
          trend="deposit · paid"
          tone="iris"
        />
        <StatCard
          label="본결제 수금 누적"
          value={fmtKRW(kpis.revenue.balancePaidTotal)}
          trend="balance · paid"
        />
        <StatCard
          label="평균 작업 기간"
          value={kpis.avgDurationDays > 0 ? `${kpis.avgDurationDays}일` : "—"}
          trend="completed 기준"
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LineSparkline
            data={kpis.dailyRevenue}
            label="최근 30일 매출"
            color="#5B47FF"
            height={120}
            trailingValue={fmtKRW(
              kpis.dailyRevenue.reduce((s, d) => s + d.amount, 0),
            )}
          />
        </div>
        <FunnelTile {...kpis.funnel} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <BarChart
          label="결제 상태 분포 (건수)"
          rows={kpis.paymentStatusDist
            .filter((r) => r.count > 0)
            .map((r) => ({
              key: paymentStatusLabels[r.status as PaymentStatus],
              value: r.count,
              tone:
                r.status === "paid"
                  ? "#4ADE80"
                  : r.status === "pending"
                  ? "#F59E0B"
                  : r.status === "failed"
                  ? "#F87171"
                  : "#C7C7D0",
            }))}
          formatValue={(n) => `${n}건`}
        />
        <BarChart
          label="프로젝트 상태 분포 (건수)"
          rows={kpis.projectStatusDist
            .filter((r) => r.count > 0)
            .map((r) => ({
              key: projectStatusLabels[r.status as ProjectStatus],
              value: r.count,
              tone:
                r.status === "completed" || r.status === "delivered"
                  ? "#4ADE80"
                  : r.status === "cancelled"
                  ? "#F87171"
                  : "#5B47FF",
            }))}
          formatValue={(n) => `${n}건`}
        />
        <BarChart
          label="서비스별 매출 (최근 6개월, 완료)"
          rows={kpis.revenueByService.map((r) => ({
            key: r.service,
            value: r.amount,
            tone: "#5B47FF",
          }))}
          formatValue={(n) => fmtKRW(n)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <AdminCard
          title="최근 문의"
          action={
            <Link href="/admin/inquiries" className="text-ink-50 hover:text-iris">
              전체 보기 →
            </Link>
          }
          className="lg:col-span-2"
        >
          {data.recentInquiries.length === 0 ? (
            <EmptyState title="아직 문의가 없습니다" />
          ) : (
            <ul className="divide-y divide-ink-15">
              {data.recentInquiries.map((i) => (
                <li key={i.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-iris-light font-display text-[12px] font-bold text-iris">
                    {i.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/inquiries/${i.id}`}
                      className="block font-display text-[13px] font-bold text-ink-100 hover:text-iris"
                    >
                      {i.name} <span className="font-normal text-ink-50">· {i.email}</span>
                    </Link>
                    <p className="mt-0.5 truncate text-[12px] text-ink-70">
                      {i.company ? `${i.company} · ` : ""}{i.service_type ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <InquiryStatusBadge status={i.status} />
                    <p className="text-[10px] text-ink-50">
                      {formatDistanceToNow(new Date(i.created_at), {
                        locale: ko,
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="오늘 작업 큐">
          {data.todayProjects.length === 0 ? (
            <EmptyState title="진행 중 프로젝트 없음" />
          ) : (
            <ul className="space-y-3">
              {data.todayProjects.map((p) => (
                <li key={p.id} className="rounded-xl border border-ink-15 px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="line-clamp-1 font-display text-[12.5px] font-bold text-ink-100 hover:text-iris"
                    >
                      {p.title}
                    </Link>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 truncate text-[11px] text-ink-50">
                    {p.client_name}{p.due_date ? ` · ~${p.due_date}` : ""}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-15">
                    <div
                      className="h-full rounded-full bg-iris"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard title="최근 활동">
        {data.activity.length === 0 ? (
          <EmptyState
            title="아직 기록된 활동이 없습니다"
            description="문의·견적·프로젝트 작업이 시작되면 여기에 표시됩니다."
          />
        ) : (
          <ul className="space-y-2">
            {data.activity.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-ink-15 px-3 py-2"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-5">
                  <i className="ti ti-activity text-[14px] text-ink-70" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] text-ink-100">
                    <span className="font-display font-bold uppercase tracking-[0.06em] text-ink-50">
                      {a.entity_type}
                    </span>{" "}
                    · {a.action}
                  </p>
                </div>
                <span className="text-[10px] text-ink-50">
                  {format(new Date(a.created_at), "HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
