import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { portfolio } from "@/lib/site-data";

type Item = (typeof portfolio)[number];

export function Portfolio() {
  return (
    <section className="section bg-ink-05" id="portfolio">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeader
            eyebrow="PORTFOLIO · SELECTED WORKS"
            title={
              <>
                숫자로 증명되는
                <br />
                크리에이티브.
              </>
            }
            desc="실제 운영 데이터에 기반한 결과 중심의 작업들입니다. 모든 케이스는 디렉터 큐레이션을 거쳐 정제되었습니다."
          />
          <div className="meta hidden sm:block">{`0${portfolio.length} CASES`}</div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((item, i) => (
            <Reveal key={item.code} delay={i * 0.04}>
              <PortfolioCard item={item} index={i} />
            </Reveal>
          ))}

          <Reveal delay={portfolio.length * 0.04}>
            <a
              href="#contact"
              className="group flex h-full min-h-[360px] flex-col justify-between rounded-3xl border border-dashed border-ink-30 bg-white p-6 transition-colors hover:border-ink-100"
            >
              <div>
                <div className="meta">MORE CASES</div>
                <h3 className="mt-3 max-w-[14ch] font-sans text-2xl font-semibold tracking-tightest text-ink-100">
                  더 많은 작업이 궁금하신가요?
                </h3>
              </div>
              <span className="inline-flex items-center gap-2 text-sm text-ink-70 transition-colors group-hover:text-ink-100">
                전체 포트폴리오 요청 →
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PortfolioCard({ item, index }: { item: Item; index: number }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-15 bg-white transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-ink-30 hover:shadow-soft">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={{ background: item.palette[2] }}
      >
        <Visual item={item} index={index} />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="meta inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-ink-70 backdrop-blur">
            {item.category}
          </span>
        </div>
        <div className="absolute right-4 top-4">
          <span className="meta inline-flex items-center gap-1 rounded-full bg-ink-100/85 px-2.5 py-1 text-white backdrop-blur">
            {item.code}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="font-sans text-xl font-semibold tracking-tightest text-ink-100">
            {item.title}
          </h3>
          <p className="mt-2 text-sm text-ink-70">{item.goal}</p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-ink-15 pt-4">
          <Kv k="제작시간" v={item.duration} />
          <Kv k="결과" v={item.result} mono />
        </div>
      </div>
    </article>
  );
}

function Kv({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="meta">{k}</div>
      <div
        className={`mt-1 truncate text-sm text-ink-100 ${
          mono ? "font-mono text-xs sm:text-sm" : ""
        }`}
      >
        {v}
      </div>
    </div>
  );
}

function Visual({ item, index }: { item: Item; index: number }) {
  if (index === 0) return <BeautyDetail palette={item.palette} />;
  if (index === 1) return <FnBSmartstore palette={item.palette} />;
  if (index === 2) return <FashionBanner palette={item.palette} />;
  if (index === 3) return <Carousel palette={item.palette} />;
  return <Thumbnail palette={item.palette} />;
}

function BeautyDetail({ palette }: { palette: string[] }) {
  return (
    <div className="absolute inset-0 p-5" style={{ background: palette[2] }}>
      <div className="flex h-full flex-col gap-3 rounded-2xl border border-ink-15 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="meta">DETAIL · 01</span>
          <span className="font-mono text-[10px] text-ink-50">SS · BEAUTY</span>
        </div>
        <div
          className="h-20 w-full rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
          }}
        />
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 rounded-full bg-ink-15" />
          <div className="h-2 w-1/2 rounded-full bg-ink-15" />
        </div>
        <div className="mt-auto grid grid-cols-3 gap-1.5">
          <div className="aspect-square rounded-md bg-ink-05" />
          <div className="aspect-square rounded-md bg-ink-05" />
          <div className="aspect-square rounded-md" style={{ background: palette[0] }} />
        </div>
      </div>
    </div>
  );
}

function FnBSmartstore({ palette }: { palette: string[] }) {
  return (
    <div className="absolute inset-0 p-5" style={{ background: palette[2] }}>
      <div className="flex h-full gap-3">
        <div
          className="relative w-2/5 overflow-hidden rounded-2xl"
          style={{
            background: `linear-gradient(160deg, ${palette[1]} 0%, ${palette[0]} 100%)`,
          }}
        >
          <div className="absolute inset-x-3 bottom-3">
            <div className="meta-dark mb-1">F&B</div>
            <div className="font-sans text-sm font-semibold text-white">
              Daily Brew
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-ink-15 bg-white p-3">
          <div className="meta">SMARTSTORE</div>
          <div className="h-2 w-3/4 rounded-full bg-ink-15" />
          <div className="h-2 w-1/2 rounded-full bg-ink-15" />
          <div className="mt-auto flex items-end justify-between">
            <div className="font-mono text-[10px] text-ink-50">ROAS</div>
            <div className="font-sans text-2xl font-semibold tracking-tightest text-ink-100">
              4.1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FashionBanner({ palette }: { palette: string[] }) {
  return (
    <div
      className="absolute inset-0 p-5"
      style={{
        background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
      }}
    >
      <div className="flex h-full flex-col justify-between text-white">
        <div className="flex items-start justify-between">
          <span className="meta-dark">CAMPAIGN · SS</span>
          <span className="font-mono text-[10px] text-white/60">A / B / C / D</span>
        </div>
        <div>
          <div className="font-sans text-2xl font-semibold leading-tight tracking-tightest">
            Made for
            <br />
            tomorrow.
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
            <span className="font-mono text-[10px] uppercase tracking-meta text-white/70">
              SHOP NOW
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Carousel({ palette }: { palette: string[] }) {
  return (
    <div className="absolute inset-0 p-5" style={{ background: palette[2] }}>
      <div className="flex h-full items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="relative flex h-full flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-ink-15 p-3"
            style={{
              background: i === 1 ? palette[0] : "#ffffff",
              color: i === 1 ? "#ffffff" : undefined,
            }}
          >
            <div
              className={`meta ${i === 1 ? "meta-dark" : ""}`}
            >
              {`0${i + 1}/03`}
            </div>
            <div>
              <div
                className={`h-2 w-3/4 rounded-full ${
                  i === 1 ? "bg-white/70" : "bg-ink-15"
                }`}
              />
              <div
                className={`mt-1.5 h-2 w-1/2 rounded-full ${
                  i === 1 ? "bg-white/40" : "bg-ink-15"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Thumbnail({ palette }: { palette: string[] }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(160deg, ${palette[0]} 0%, ${palette[1]} 110%)`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="meta-dark">YT · THUMBNAIL</div>
          <div className="mt-2 font-sans text-3xl font-semibold leading-none tracking-tightest">
            BIG IDEA
          </div>
          <div className="mt-1 font-sans text-3xl font-semibold leading-none tracking-tightest text-white/60">
            in 24h.
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 right-4">
        <span className="meta-dark rounded-full bg-white/10 px-2 py-1 backdrop-blur">
          CTR · 8.7%
        </span>
      </div>
    </div>
  );
}
