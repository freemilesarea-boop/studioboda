import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { flowSteps } from "@/lib/site-data";

export function HowItWorks() {
  return (
    <section className="section bg-ink-5" id="process">
      <SectionHeader
        eyebrow="How it works"
        title="브리프부터 운영까지, 하나의 흐름"
        subtitle="AI는 빠른 탐색을 위한 도구이고, 디렉터는 톤을 책임지는 사람입니다. 두 흐름이 만나 24시간 안에 결과가 나옵니다."
      />

      <div className="relative mt-12">
        <div className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden h-px bg-ink-15 lg:block" />
        <ol className="relative grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {flowSteps.map((s, i) => (
            <Reveal as="li" key={s.step} delay={i * 0.06} className="relative">
              <FlowStepItem step={s} active={i === 0} />
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FlowStepItem({
  step,
  active,
}: {
  step: (typeof flowSteps)[number];
  active: boolean;
}) {
  return (
    <div className="px-4 text-center">
      <div
        className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border-2 text-[22px] ${
          active
            ? "border-iris bg-iris text-white"
            : "border-ink-15 bg-white text-iris"
        }`}
      >
        <i className={`ti ${step.icon}`} aria-hidden />
      </div>
      <p className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
        STEP {step.step}
      </p>
      <h4 className="font-display text-[14px] font-bold text-ink-100">
        {step.title}
      </h4>
      <p className="mx-auto mt-2 max-w-[240px] text-[12px] leading-[1.65] text-ink-50">
        {step.desc}
      </p>
    </div>
  );
}
