import { Reveal } from "./ui/Reveal";
import { brand, contactInfo } from "@/lib/site-data";

export function CTASection() {
  return (
    <section
      className="relative overflow-hidden bg-ink-100 px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
      id="contact"
    >
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-iris-grad opacity-25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-iris-grad opacity-15 blur-3xl" />

      <div className="relative grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5">
              <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center text-success live-ring">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              <span className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-success">
                {contactInfo.newProjectStatus}
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="mt-5 font-display text-[11px] font-bold uppercase tracking-eyebrow text-white/55">
              {brand.slogan}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-3 font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.8px] text-white sm:text-[42px] lg:text-[48px]">
              조용히, 정확하게.
              <br />
              내일 쓸 콘텐츠를 만듭니다.
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mt-4 max-w-xl text-[14px] leading-[1.65] text-ink-30 sm:text-[15px]">
              브랜드 · 상품 · 목표만 알려주시면 24시간 안에 회신드립니다. NDA가
              필요한 프로젝트도 사전 검토 후 진행합니다.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${brand.email}?subject=STUDIO%20BODA%20프로젝트%20문의`}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-[14px] font-bold text-ink-100 transition-opacity hover:opacity-90 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-100"
              >
                프로젝트 문의하기
                <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </a>
              <a
                href={`mailto:${brand.email}?subject=STUDIO%20BODA%20Enterprise%20문의`}
                className="inline-flex h-12 items-center justify-center rounded-xl border-[1.5px] border-white/20 bg-white/[0.06] px-7 text-[14px] font-medium text-white transition-colors hover:border-white/40 hover:bg-white/[0.12]"
              >
                Enterprise 상담
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.26}>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-30">
              <span className="inline-flex items-center gap-1.5">
                <i className="ti ti-clock text-[14px] text-sky" aria-hidden />
                {contactInfo.responseTime}
              </span>
              <span className="h-3 w-px bg-white/[0.08]" />
              <span className="inline-flex items-center gap-1.5">
                <i className="ti ti-calendar text-[14px] text-sky" aria-hidden />
                {contactInfo.workHours}
              </span>
              <span className="h-3 w-px bg-white/[0.08]" />
              <span className="inline-flex items-center gap-1.5">
                <i className="ti ti-shield-check text-[14px] text-sky" aria-hidden />
                {contactInfo.nda}
              </span>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={0.18}>
            <div className="rounded-[20px] border border-ink-90 bg-ink-90/40 p-5 backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-between">
                <p className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30">
                  How we start
                </p>
                <span className="num font-mono text-[10px] text-ink-50">
                  AVG · 24H
                </span>
              </div>

              <ol className="mt-4 space-y-2">
                {contactInfo.steps.map((step, i) => (
                  <li
                    key={step.label}
                    className="flex items-start gap-3 rounded-xl border border-ink-90 bg-ink-100/60 px-3.5 py-2.5"
                  >
                    <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-md bg-iris/20 font-display text-[11px] font-bold text-sky">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-[13px] font-bold text-white">
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-30">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <a
                href={`mailto:${brand.email}`}
                className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 transition-colors hover:border-white/[0.25] hover:bg-white/[0.08]"
              >
                <div className="min-w-0">
                  <p className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30">
                    Email
                  </p>
                  <p className="num mt-1 truncate font-mono text-[13px] text-white">
                    {brand.email}
                  </p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white">
                  →
                </span>
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
