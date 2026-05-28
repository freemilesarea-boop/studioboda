import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { process } from "@/lib/site-data";

export function Process() {
  return (
    <section className="section" id="process">
      <div className="container">
        <SectionHeader
          eyebrow="PROCESS · 5 STEPS"
          title={
            <>
              브리프부터 운영까지,
              <br />
              하나의 흐름으로 연결합니다.
            </>
          }
          desc="AI는 빠른 탐색을 위한 도구이고, 디렉터는 톤을 책임지는 사람입니다. 두 흐름이 만나 24시간 안에 결과가 나옵니다."
        />

        <ol className="mt-16 grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-5">
          {process.map((p, i) => (
            <Reveal key={p.step} delay={i * 0.05}>
              <li className="relative h-full border-t border-ink-15 pt-6 md:border-t lg:border-l lg:border-t-0 lg:pl-6 lg:pr-4 lg:pt-0 lg:[&:first-child]:border-l-0 lg:[&:first-child]:pl-0">
                <div className="flex items-center justify-between">
                  <span className="meta">STEP {p.step}</span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-iris" />
                </div>
                <h3 className="mt-6 font-sans text-2xl font-semibold tracking-tightest text-ink-100 lg:text-[28px]">
                  {p.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.65] text-ink-70">
                  {p.desc}
                </p>
                <div className="mt-6 font-mono text-[11px] uppercase tracking-meta text-ink-50">
                  {p.detail}
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
