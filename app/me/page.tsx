import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  customerDashboardCounts,
  listMyInquiries,
  listMyProjects,
  listMyQuotes,
} from "@/lib/queries/customer";
import {
  inquiryStatusLabels,
  projectStatusLabels,
  quoteStatusLabels,
  type Inquiry,
  type Project,
  type Quote,
  type ProjectStatus,
} from "@/lib/types/db";

export const metadata: Metadata = {
  title: "마이페이지",
  robots: { index: false, follow: false },
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

const STATUS_COLOR: Record<ProjectStatus, string> = {
  queued: "bg-ink-15 text-ink-70",
  briefing: "bg-iris/15 text-iris",
  ai_draft: "bg-iris/15 text-iris",
  designing: "bg-sky/15 text-sky",
  review: "bg-warning/15 text-warning",
  revision: "bg-warning/15 text-warning",
  delivered: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  cancelled: "bg-error/15 text-error",
};

export default async function MeDashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/me");

  const [counts, projects, quotes, inquiries] = await Promise.all([
    customerDashboardCounts(profile.id),
    listMyProjects(profile.id),
    listMyQuotes(profile.id),
    listMyInquiries(profile.id, profile.email),
  ]);

  const activeProjects = projects.filter(
    (p) =>
      !["delivered", "completed", "cancelled"].includes(p.status),
  );
  const completedProjects = projects.filter((p) =>
    ["delivered", "completed"].includes(p.status),
  );

  const displayName = profile.name || profile.email.split("@")[0];

  return (
    <div className="space-y-6">
      {/* Hello header — PDF application mockup mood */}
      <section className="overflow-hidden rounded-[20px] border border-ink-90 bg-ink-100 px-6 py-7 text-white sm:px-8 sm:py-9">
        <div className="relative">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-iris-grad opacity-25 blur-3xl" />
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris-glow">
            STUDIO BODA · MY
          </p>
          <h1 className="mt-2 font-display text-[26px] font-extrabold leading-[1.15] tracking-display sm:text-[32px]">
            Hello, <span className="bg-iris-text bg-clip-text text-transparent [-webkit-background-clip:text]">{displayName}</span>.
          </h1>
          <p className="mt-1.5 text-[13px] leading-body text-ink-30">
            생성 중인 작업 <b className="text-white">{counts.activeProjects}</b>건 · 완료된 작업{" "}
            <b className="text-white">{counts.completedProjects}</b>건
            {counts.openQuotes > 0
              ? ` · 검토 대기 견적 ${counts.openQuotes}건`
              : ""}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiTile label="진행" value={counts.activeProjects} />
            <KpiTile label="완료" value={counts.completedProjects} tone="success" />
            <KpiTile label="검토 대기 견적" value={counts.openQuotes} tone="iris" />
            <KpiTile label="신규 문의" value={counts.openInquiries} tone="warning" />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/#inquiry"
              className="inline-flex h-10 items-center rounded-lg bg-white px-4 font-display text-[12.5px] font-bold text-ink-100 hover:opacity-90"
            >
              새 견적 요청 →
            </Link>
            <Link
              href="/services"
              className="inline-flex h-10 items-center rounded-lg border border-white/15 bg-white/[0.06] px-4 font-display text-[12.5px] font-bold text-white hover:bg-white/[0.12]"
            >
              서비스 보기
            </Link>
          </div>
        </div>
      </section>

      {/* Active jobs — PDF "Jobs" panel mood */}
      <section>
        <header className="mb-3 flex items-end justify-between">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
              In progress
            </p>
            <h2 className="mt-1 font-display text-[16px] font-extrabold tracking-tightish text-ink-100">
              진행 중인 작업
              <span className="num ml-2 text-[12px] font-bold text-ink-50">
                {activeProjects.length}
              </span>
            </h2>
          </div>
          <Link
            href="/me/projects"
            className="text-[12.5px] font-bold text-ink-50 hover:text-iris"
          >
            전체 보기 →
          </Link>
        </header>

        {activeProjects.length === 0 ? (
          <EmptyState
            icon="ti-folders"
            title="진행 중인 작업이 없습니다"
            description="새 견적이 수락되면 자동으로 프로젝트가 시작됩니다."
          />
        ) : (
          <ul className="space-y-2.5">
            {activeProjects.slice(0, 4).map((p) => (
              <JobRow key={p.id} p={p} />
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentQuotes quotes={quotes.slice(0, 4)} />
        <RecentInquiries inquiries={inquiries.slice(0, 4)} />
      </div>

      {completedProjects.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-[14px] font-bold tracking-tightish text-ink-100">
            최근 완료된 작업
          </h2>
          <ul className="space-y-2">
            {completedProjects.slice(0, 4).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-ink-15 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/me/projects/${p.id}`}
                    className="block truncate font-display text-[13px] font-bold text-ink-100 hover:text-iris"
                  >
                    {p.title}
                  </Link>
                  <p className="text-[11px] text-ink-50">
                    {projectStatusLabels[p.status]} ·{" "}
                    {format(new Date(p.updated_at), "yyyy-MM-dd")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption ${STATUS_COLOR[p.status]}`}
                >
                  {projectStatusLabels[p.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function KpiTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "iris" | "success" | "warning";
}) {
  const accent: Record<typeof tone, string> = {
    default: "text-white",
    iris: "text-iris-glow",
    success: "text-success",
    warning: "text-warning",
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <p className="font-display text-[10px] font-bold uppercase tracking-caption text-ink-30">
        {label}
      </p>
      <p
        className={`num mt-1 font-display text-[22px] font-extrabold leading-none tracking-tightish ${accent[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}

function JobRow({ p }: { p: Project }) {
  return (
    <li className="rounded-2xl border border-ink-15 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/me/projects/${p.id}`}
            className="block truncate font-display text-[14px] font-bold text-ink-100 hover:text-iris"
          >
            {p.title}
          </Link>
          <p className="mt-0.5 truncate text-[11px] text-ink-50">
            {p.service_type ?? "—"}
            {p.due_date ? ` · 납기 ${p.due_date}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption ${STATUS_COLOR[p.status]}`}
        >
          {projectStatusLabels[p.status]}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-15">
          <div
            className="h-full rounded-full bg-iris transition-[width] duration-500"
            style={{ width: `${p.progress}%` }}
          />
        </div>
        <span className="num text-[11px] font-bold text-ink-70">
          {p.progress}%
        </span>
      </div>
    </li>
  );
}

function RecentQuotes({ quotes }: { quotes: Quote[] }) {
  return (
    <section>
      <header className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-[14px] font-bold tracking-tightish text-ink-100">
          최근 견적
        </h2>
        <Link
          href="/me/quotes"
          className="text-[12px] font-bold text-ink-50 hover:text-iris"
        >
          전체 →
        </Link>
      </header>
      {quotes.length === 0 ? (
        <EmptyState
          icon="ti-file-invoice"
          title="발행된 견적이 없습니다"
          description="문의가 검토되면 견적서가 발송됩니다."
        />
      ) : (
        <ul className="space-y-2">
          {quotes.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between rounded-xl border border-ink-15 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/me/quotes/${q.id}`}
                  className="block truncate font-display text-[13px] font-bold text-ink-100 hover:text-iris"
                >
                  {q.title}
                </Link>
                <p className="text-[11px] text-ink-50">
                  {quoteStatusLabels[q.status]} ·{" "}
                  {format(new Date(q.created_at), "yyyy-MM-dd")}
                </p>
              </div>
              <span className="num shrink-0 font-display text-[14px] font-extrabold text-ink-100">
                {fmt(q.total_price)}원
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentInquiries({ inquiries }: { inquiries: Inquiry[] }) {
  return (
    <section>
      <header className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-[14px] font-bold tracking-tightish text-ink-100">
          최근 문의
        </h2>
        <Link
          href="/me/inquiries"
          className="text-[12px] font-bold text-ink-50 hover:text-iris"
        >
          전체 →
        </Link>
      </header>
      {inquiries.length === 0 ? (
        <EmptyState
          icon="ti-mail"
          title="아직 접수된 문의가 없습니다"
          description="메인 페이지의 견적 폼에서 시작해보세요."
        />
      ) : (
        <ul className="space-y-2">
          {inquiries.map((i) => (
            <li
              key={i.id}
              className="rounded-xl border border-ink-15 bg-white px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/me/inquiries/${i.id}`}
                  className="font-display text-[13px] font-bold text-ink-100 hover:text-iris"
                >
                  {i.service_type ?? "(서비스 미선택)"}
                </Link>
                <span className="text-[11px] text-ink-50">
                  {formatDistanceToNow(new Date(i.created_at), {
                    locale: ko,
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-[12px] text-ink-70">
                {inquiryStatusLabels[i.status]}
                {i.message ? ` · ${i.message}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-4 py-10 text-center">
      <i className={`ti ${icon} text-[24px] text-ink-30`} aria-hidden />
      <p className="mt-2 font-display text-[13px] font-bold text-ink-100">
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-[12px] text-ink-50">{description}</p>
      ) : null}
    </div>
  );
}
