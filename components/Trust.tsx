import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { trustStats, reviews } from "@/lib/site-data";

export function Trust() {
  return (
    <section className="section bg-ink-5" id="trust">
      <SectionHeader
        eyebrow="Trust"
        title="숫자로 증명되는 결과"
        subtitle="320개 이상 브랜드와 함께 만든 2,400건의 콘텐츠. 결과는 데이터로 남깁니다."
      />

      <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {trustStats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.04}>
            <div className="rounded-2xl border border-ink-15 bg-white p-5">
              <p className="font-display text-[28px] font-extrabold leading-none tracking-[-0.5px] text-ink-100 sm:text-[34px]">
                {s.num}
                <span className="text-iris">{s.suffix}</span>
              </p>
              <p className="mt-2 text-[12px] text-ink-50">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={r.initials + r.role} delay={i * 0.05}>
            <article className="flex h-full gap-3.5 rounded-[14px] border border-ink-15 bg-white px-5 py-5">
              <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-iris-light text-[12px] font-bold text-iris">
                {r.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[13px] font-bold text-ink-100">
                    {r.initials}
                  </span>
                  <span className="text-[11px] text-ink-50">{r.role}</span>
                  <span className="rounded-full bg-iris-light px-2 py-0.5 text-[10px] font-bold text-iris">
                    {r.badge}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-[1.65] text-ink-70">
                  {r.body}
                </p>
                <p className="mt-2 text-[12px] font-bold text-warning">
                  ★★★★★ {r.rating}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
