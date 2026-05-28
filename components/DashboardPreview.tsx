import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { dashboardJobs, dashboardSidebar } from "@/lib/site-data";

export function DashboardPreview() {
  return (
    <section className="section bg-white" id="dashboard">
      <SectionHeader
        eyebrow="Dashboard"
        title="제작 상태를 한눈에"
        subtitle="주문부터 검수, 납품까지의 진행 상태와 디렉터 코멘트를 한 화면에서 관리합니다."
        action={
          <a
            href="#quote"
            className="text-[13px] font-semibold text-iris transition-opacity hover:opacity-80"
          >
            데모 신청하기 →
          </a>
        }
      />

      <Reveal delay={0.1}>
        <div className="mt-10 overflow-hidden rounded-[20px] border border-ink-90 bg-ink-100">
          <div className="flex items-center gap-3 border-b border-ink-90 px-5 py-3.5">
            <span className="font-display text-[13px] font-semibold text-white">
              내 주문 현황
            </span>
            <span className="ml-auto rounded-full bg-iris/20 px-2.5 py-1 text-[11px] font-semibold text-sky">
              진행 중 2건
            </span>
            <span className="rounded-full bg-[rgba(74,222,128,0.14)] px-2.5 py-1 text-[11px] font-semibold text-success">
              완료 8건
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
            <aside className="border-b border-ink-90 p-4 md:border-b-0 md:border-r">
              <div className="meta-eyebrow mb-3 font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-50">
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
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex flex-col gap-2 p-4 sm:p-5">
              {dashboardJobs.map((job) => (
                <OrderItem key={job.title} job={job} />
              ))}
              <a
                href="#quote"
                className="mt-1 flex h-12 items-center justify-center rounded-[11px] border border-dashed border-ink-90 text-[12px] font-semibold text-ink-30 transition-colors hover:border-ink-70 hover:text-white"
              >
                + 새 주문 만들기
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function OrderItem({ job }: { job: (typeof dashboardJobs)[number] }) {
  const barColor =
    job.tone === "iris"
      ? "bg-iris"
      : job.tone === "sky"
      ? "bg-sky"
      : "bg-success";
  const iconBg =
    job.tone === "iris"
      ? "bg-iris/20 text-sky"
      : job.tone === "sky"
      ? "bg-sky/20 text-sky"
      : "bg-[rgba(74,222,128,0.14)] text-success";
  const done = job.tone === "done";

  return (
    <div className="flex items-center gap-3 rounded-[11px] bg-ink-90 px-4 py-3">
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] ${iconBg}`}
      >
        <i className={`ti ${job.icon} text-[16px]`} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-white">
          {job.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-ink-50">{job.sub}</p>
      </div>
      <div className="ml-auto min-w-[100px] text-right">
        {done ? (
          <span className="inline-block rounded-full bg-[rgba(74,222,128,0.18)] px-2.5 py-1 text-[10px] font-bold text-success">
            완료
          </span>
        ) : (
          <>
            <div className="mb-1 h-1 w-[90px] overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={`h-full rounded-full ${barColor}`}
                style={{ width: `${job.progress}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-sky">
              {job.progress}% · {job.status}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
