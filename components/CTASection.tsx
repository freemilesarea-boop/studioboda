import { Reveal } from "./ui/Reveal";
import { brand } from "@/lib/site-data";

export function CTASection() {
  return (
    <section
      className="relative overflow-hidden bg-iris px-5 py-20 text-center sm:px-8 lg:px-12"
      id="contact"
    >
      <Reveal>
        <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-white/70">
          {brand.slogan}
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-3 font-display text-[32px] font-extrabold leading-[1.2] tracking-[-0.6px] text-white sm:text-[40px] lg:text-[44px]">
          지금 바로 시작해보세요
        </h2>
      </Reveal>
      <Reveal delay={0.12}>
        <p className="mx-auto mt-3.5 max-w-xl text-[14px] leading-[1.65] text-white/70 sm:text-[15px]">
          첫 프로젝트 10% 할인 · 견적은 무료 · 3분이면 신청 완료
        </p>
      </Reveal>
      <Reveal delay={0.18}>
        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <a
            href={`mailto:${brand.email}?subject=STUDIO%20BODA%20프로젝트%20문의`}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-8 text-[15px] font-bold text-iris transition-opacity hover:opacity-90 focus-ring"
          >
            무료 견적 받기
            <span className="transition-transform duration-150 group-hover:translate-x-0.5">
              →
            </span>
          </a>
          <a
            href="#portfolio"
            className="inline-flex h-12 items-center justify-center rounded-xl border-[1.5px] border-white/25 bg-white/[0.12] px-7 text-[15px] font-medium text-white transition-colors hover:bg-white/[0.2] focus-ring"
          >
            포트폴리오 먼저 보기
          </a>
        </div>
      </Reveal>
      <Reveal delay={0.24}>
        <p className="mt-6 text-[12px] text-white/60">
          <a
            href={`mailto:${brand.email}`}
            className="underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
          >
            {brand.email}
          </a>
          {"  ·  "}
          평균 회신 24시간 이내
        </p>
      </Reveal>
    </section>
  );
}
