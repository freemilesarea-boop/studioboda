import { Reveal } from "./ui/Reveal";
import { clientLogos, clientStats } from "@/lib/site-data";

export function ClientLogos() {
  const loop = [...clientLogos, ...clientLogos];
  return (
    <section className="section-tight border-y border-ink-15 bg-white" aria-label="함께한 브랜드">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_2fr] lg:gap-12">
        <Reveal>
          <div>
            <p className="eyebrow">Trusted by</p>
            <h3 className="mt-2 font-display text-[20px] font-extrabold leading-[1.25] tracking-[-0.4px] text-ink-100 sm:text-[22px] lg:text-[24px]">
              <span className="num text-iris">{clientStats.totalBrands}</span>{" "}
              브랜드가 BODA와 함께합니다.
            </h3>
            <p className="mt-2 max-w-[300px] text-[12px] leading-[1.65] text-ink-50">
              D2C 브랜드 · 스마트스토어 셀러 · 스타트업 · 광고대행사까지. 카테고리에
              관계없이 결과로 검증되는 콘텐츠를 만듭니다.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div
            className="group relative overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
            }}
          >
            <div
              className="marquee-track flex w-max items-center gap-7 sm:gap-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-x-8 motion-reduce:gap-y-3"
              aria-hidden
            >
              {loop.map((c, i) => (
                <LogoWordmark
                  key={`${c.name}-${i}`}
                  name={c.name}
                  sector={c.sector}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ink-15 pt-6 sm:grid-cols-3 lg:grid-cols-6">
          {clientStats.byCategory.map((c) => (
            <div key={c.label} className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-ink-50">{c.label}</span>
              <span className="num font-display text-[14px] font-extrabold tracking-[-0.3px] text-ink-100">
                {c.value}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function LogoWordmark({ name, sector }: { name: string; sector: string }) {
  return (
    <div
      className="flex shrink-0 items-baseline gap-1.5"
      title={`${name} · ${sector}`}
    >
      <span className="font-display text-[18px] font-extrabold uppercase tracking-[-0.4px] text-ink-70 transition-colors duration-200 hover:text-ink-100">
        {name}
      </span>
      <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-ink-30 sm:inline">
        {sector}
      </span>
    </div>
  );
}
