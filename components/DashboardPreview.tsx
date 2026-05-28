import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { StartCTA } from "./StartCTA";
import {
  dashboardJobs,
  dashboardSidebar,
  activityFeed,
  recentExports,
  type DashboardJob,
  type ActivityEvent,
  type Export,
} from "@/lib/site-data";

export function DashboardPreview() {
  return (
    <section className="section bg-white" id="dashboard">
      <SectionHeader
        eyebrow="Dashboard"
        title="제작 상태를 한눈에"
        subtitle="주문 · 진행 · 검수 · 내보내기 · 활동 로그까지. 디렉터와 클라이언트가 같은 화면에서 호흡합니다."
        action={
          <StartCTA
            size="sm"
            variant="ghost-dark"
            className="!bg-transparent !text-iris"
          >
            데모 신청하기 →
          </StartCTA>
        }
      />

      <Reveal delay={0.08}>
        <div className="mt-10 overflow-hidden rounded-[20px] border border-ink-90 bg-ink-100">
          <TopBar />

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
            <Sidebar />

            <div className="grid grid-cols-1 gap-5 p-4 sm:p-5 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <PanelHeader title="Today’s queue" meta="5 active · AVG 24H" />
                <div className="mt-3 flex flex-col gap-2">
                  {dashboardJobs.slice(0, 4).map((job) => (
                    <OrderItem key={job.id} job={job} />
                  ))}
                </div>

                <PanelHeader
                  title="Recent exports"
                  meta="4 · 8.5MB"
                  className="mt-6"
                />
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {recentExports.map((e) => (
                    <ExportTile key={e.title} item={e} />
                  ))}
                </div>
              </div>

              <aside className="lg:col-span-2">
                <PanelHeader title="Activity" meta="실시간 로그" />
                <ol className="relative mt-3 flex flex-col gap-0">
                  {activityFeed.map((evt, i) => (
                    <ActivityRow
                      key={evt.time + evt.message}
                      event={evt}
                      last={i === activityFeed.length - 1}
                    />
                  ))}
                </ol>

                <PanelHeader
                  title="System"
                  meta=""
                  className="mt-6"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <SystemStat label="대기 큐" value="3" unit="건" />
                  <SystemStat label="평균 응답" value="22" unit="m" />
                  <SystemStat label="GPU 가용" value="78" unit="%" tone="iris" />
                  <SystemStat label="에러율" value="0.4" unit="%" tone="success" />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function TopBar() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-ink-90 px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <span className="relative inline-flex h-2 w-2 items-center justify-center text-success live-ring">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="font-display text-[13px] font-semibold text-white">
          내 주문 현황
        </span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-iris/20 px-2.5 py-1 text-[11px] font-semibold text-sky">
          진행 중 2건
        </span>
        <span className="rounded-full bg-sky/15 px-2.5 py-1 text-[11px] font-semibold text-sky">
          검수 1건
        </span>
        <span className="rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning">
          내보내기 1건
        </span>
        <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
          완료 8건
        </span>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="border-b border-ink-90 p-4 md:border-b-0 md:border-r">
      <div className="mb-3 font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-50">
        MENU
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col scrollbar-none">
        {dashboardSidebar.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`flex w-full shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] transition-colors md:shrink ${
              item.active
                ? "bg-iris/15 text-sky"
                : "text-ink-50 hover:bg-white/[0.04]"
            }`}
          >
            <i className={`ti ${item.icon} text-[15px]`} aria-hidden />
            <span>{item.label}</span>
            {item.active && (
              <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-sky md:inline-block" />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-5 hidden rounded-[12px] border border-ink-90 bg-ink-90/40 p-3 md:block">
        <div className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-50">
          PLAN
        </div>
        <div className="mt-1 font-display text-[13px] font-bold text-white">
          Pro · ₩390,000/월
        </div>
        <div className="mt-1.5 text-[10px] text-ink-50">월 5건 중 2건 사용</div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div className="h-full w-2/5 rounded-full bg-iris" />
        </div>
      </div>
    </aside>
  );
}

function PanelHeader({
  title,
  meta,
  className = "",
}: {
  title: string;
  meta?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="font-display text-[12px] font-bold uppercase tracking-eyebrow text-ink-30">
        {title}
      </p>
      {meta && <p className="num font-mono text-[10px] text-ink-50">{meta}</p>}
    </div>
  );
}

function OrderItem({ job }: { job: DashboardJob }) {
  const stateMap = {
    rendering: { bar: "bg-iris", icon: "bg-iris/20 text-sky", label: "RENDERING" },
    review: { bar: "bg-sky", icon: "bg-sky/20 text-sky", label: "REVIEW" },
    export: { bar: "bg-warning", icon: "bg-warning/15 text-warning", label: "EXPORT" },
    done: { bar: "bg-success", icon: "bg-success/15 text-success", label: "DELIVERED" },
  } as const;
  const m = stateMap[job.state];

  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-ink-90 bg-ink-90 px-3 py-3 transition-colors duration-200 hover:border-ink-70 sm:px-4">
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] ${m.icon}`}
      >
        <i className={`ti ${job.icon} text-[15px]`} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="truncate font-display text-[12px] font-semibold text-white">
            {job.title}
          </p>
          <span className="num font-mono text-[10px] text-ink-50">
            {job.id}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-ink-50">
          {job.client} · {job.sub}
        </p>

        {(job.state === "rendering" || job.state === "review") && (
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={`h-full rounded-full ${m.bar}`}
                style={{ width: `${job.progress}%` }}
              />
            </div>
            <span className="num text-[10px] font-semibold text-sky">
              {job.progress}%
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.08em] ${
            job.state === "rendering"
              ? "bg-iris/15 text-sky"
              : job.state === "review"
              ? "bg-sky/15 text-sky"
              : job.state === "export"
              ? "bg-warning/15 text-warning"
              : "bg-success/15 text-success"
          }`}
        >
          {m.label}
        </span>
        <span className="text-[10px] text-ink-50">{job.eta}</span>
      </div>
    </div>
  );
}

function ExportTile({ item }: { item: Export }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-ink-90 bg-ink-90">
      <div
        className="flex h-[60px] items-center justify-center"
        style={{ background: item.bg }}
      >
        <span
          className="font-display text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{ color: item.fg }}
        >
          {item.label}
        </span>
      </div>
      <div className="px-2.5 py-2">
        <p className="truncate font-display text-[11px] font-semibold text-white">
          {item.title}
        </p>
        <p className="num mt-0.5 truncate font-mono text-[9px] text-ink-50">
          {item.format} · {item.size}
        </p>
      </div>
    </div>
  );
}

function ActivityRow({
  event,
  last,
}: {
  event: ActivityEvent;
  last: boolean;
}) {
  const tone: Record<ActivityEvent["type"], { icon: string; cls: string }> = {
    ai: { icon: "ti-cpu", cls: "bg-iris/20 text-sky" },
    director: { icon: "ti-user-check", cls: "bg-sky/15 text-sky" },
    export: { icon: "ti-download", cls: "bg-warning/15 text-warning" },
    client: { icon: "ti-messages", cls: "bg-plum/20 text-plum" },
    queue: { icon: "ti-stack-2", cls: "bg-ink-90 text-ink-30" },
  };
  const t = tone[event.type];
  return (
    <li className="relative flex gap-3 pl-7">
      <span
        className={`absolute left-0 top-0 grid h-6 w-6 place-items-center rounded-md ${t.cls}`}
      >
        <i className={`ti ${t.icon} text-[12px]`} aria-hidden />
      </span>
      {!last && (
        <span className="absolute left-3 top-7 h-[calc(100%-12px)] w-px bg-ink-90" />
      )}
      <div className="min-w-0 pb-4">
        <div className="flex items-center gap-2">
          <span className="num font-mono text-[10px] text-ink-50">
            {event.time}
          </span>
          {event.meta && (
            <span className="num rounded-full bg-ink-90 px-1.5 py-0.5 font-mono text-[9px] text-ink-50">
              {event.meta}
            </span>
          )}
        </div>
        <p className="mt-1 text-[12px] leading-[1.55] text-ink-30">
          {event.message}
        </p>
      </div>
    </li>
  );
}

function SystemStat({
  label,
  value,
  unit,
  tone = "default",
}: {
  label: string;
  value: string;
  unit: string;
  tone?: "default" | "iris" | "success";
}) {
  const colorMap = {
    default: "text-white",
    iris: "text-sky",
    success: "text-success",
  } as const;
  return (
    <div className="rounded-[10px] border border-ink-90 bg-ink-90/40 px-3 py-2.5">
      <div className="font-display text-[9px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={`num font-display text-[18px] font-extrabold tracking-[-0.4px] ${colorMap[tone]}`}
        >
          {value}
        </span>
        <span className="text-[10px] text-ink-50">{unit}</span>
      </div>
    </div>
  );
}
