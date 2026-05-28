import { Reveal } from "./ui/Reveal";
import { brandGroup, clientLogos } from "@/lib/site-data";

export function ClientLogos() {
  const loop = [...clientLogos, ...clientLogos];
  return (
    <section
      className="section-tight border-y border-ink-15 bg-white"
      aria-label="브랜드 그룹"
      id="brands"
    >
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 xl:gap-20">
        <Reveal>
          <div className="max-w-[460px]">
            <p className="eyebrow">{brandGroup.eyebrow}</p>
            <h3 className="mt-3 text-balance font-display text-[22px] font-extrabold leading-[1.28] tracking-[-0.5px] text-ink-100 sm:text-[24px] lg:text-[26px]">
              {brandGroup.title}{" "}
              <span className="text-iris">{brandGroup.titleAccent}</span>
            </h3>
            <p className="mt-4 max-w-[420px] text-[13px] leading-[1.7] text-ink-50 sm:text-[13.5px]">
              {brandGroup.description}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div
            className="group relative overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%)",
            }}
          >
            <div
              className="marquee-track flex w-max items-center gap-10 sm:gap-14 lg:gap-16 group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-x-10 motion-reduce:gap-y-4"
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
        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-ink-15 pt-6 sm:gap-x-9 lg:mt-12">
          <span className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30">
            Capabilities
          </span>
          {brandGroup.capabilities.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-ink-70"
            >
              <span
                className="inline-block h-[3px] w-[3px] rounded-full bg-iris"
                aria-hidden
              />
              {label}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function LogoWordmark({ name, sector }: { name: string; sector: string }) {
  return (
    <div
      className="flex shrink-0 items-baseline gap-2"
      title={`${name} · ${sector}`}
    >
      <span className="font-display text-[17px] font-extrabold uppercase tracking-[-0.3px] text-ink-70 transition-colors duration-200 hover:text-ink-100 sm:text-[19px]">
        {name}
      </span>
      <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-ink-30 sm:inline">
        {sector}
      </span>
    </div>
  );
}
