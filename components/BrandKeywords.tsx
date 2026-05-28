import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { brandKeywords } from "@/lib/site-data";

export function BrandKeywords() {
  return (
    <section className="section" id="keywords">
      <div className="container">
        <SectionHeader
          eyebrow="VALUES · KEYWORDS"
          title={
            <>
              빠르게, 정교하게,
              <br />
              브랜드답게 만듭니다.
            </>
          }
          desc="STUDIO BODA는 속도와 감각을 동시에 만족시키기 위해 다섯 가지 원칙을 지킵니다."
        />

        <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brandKeywords.map((k, i) => (
            <Reveal key={k.en} delay={i * 0.04}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-ink-15 bg-white p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-ink-30">
                <div className="flex items-start justify-between">
                  <span className="meta">{k.no}</span>
                  <span className="meta">{k.en}</span>
                </div>

                <h3 className="mt-10 font-sans text-2xl font-semibold tracking-tightest text-ink-100">
                  {k.title}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.65] text-ink-70">
                  {k.desc}
                </p>

                <div className="mt-8 flex items-center justify-between border-t border-ink-15 pt-4">
                  <span className="font-mono text-xs text-ink-50">
                    {k.metric}
                  </span>
                  <span className="relative inline-block h-2 w-2 rounded-full bg-ink-15 transition-colors duration-300 group-hover:bg-iris" />
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px translate-y-px bg-iris-grad opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
