import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { portfolio, type Portfolio as PortfolioItem } from "@/lib/site-data";

export function Portfolio() {
  return (
    <section className="section bg-white" id="portfolio">
      <SectionHeader
        eyebrow="Portfolio"
        title="실제로 운영되는 결과물"
        subtitle="데이터로 증명된 케이스 중심으로 정리했습니다. 모든 산출물은 시니어 디렉터 큐레이션을 거쳐 정제되었습니다."
        action={
          <a
            href="#contact"
            className="text-[13px] font-semibold text-iris transition-opacity hover:opacity-80"
          >
            전체 포트폴리오 요청 →
          </a>
        }
      />

      <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {portfolio.map((p, i) => (
          <Reveal key={p.code} delay={i * 0.04}>
            <PortfolioCard item={p} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PortfolioCard({
  item,
  index,
}: {
  item: PortfolioItem;
  index: number;
}) {
  return (
    <article className="group cursor-pointer overflow-hidden rounded-2xl border border-ink-15 bg-white transition-transform duration-150 hover:-translate-y-0.5">
      <PortfolioThumb item={item} index={index} />
      <div className="px-4 py-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-iris">
          {item.cat}
        </p>
        <h4 className="mt-1 line-clamp-2 font-display text-[13px] font-bold leading-[1.45] text-ink-100">
          {item.title}
        </h4>
        <p className="mt-1.5 text-[11px] text-ink-50">{item.summary}</p>
        <div className="mt-3 flex items-center justify-between border-t border-ink-15 pt-3">
          <span className="text-[11px] text-ink-50">
            제작 {item.duration} · {item.result}
          </span>
          <span className="text-[11px] font-semibold text-ink-70">
            ★ {item.rating}
          </span>
        </div>
      </div>
    </article>
  );
}

function PortfolioThumb({
  item,
  index,
}: {
  item: PortfolioItem;
  index: number;
}) {
  const variants = [
    DetailMock,
    AdMock,
    SnsMock,
    ThumbMock,
    BrandMock,
    DetailAltMock,
  ];
  const Mock = variants[index % variants.length] ?? DetailMock;
  return (
    <div
      className="relative h-[148px] w-full overflow-hidden"
      style={{ background: item.bg }}
    >
      <Mock item={item} />
    </div>
  );
}

type MockProps = { item: PortfolioItem };

function DetailMock({ item }: MockProps) {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="flex w-full max-w-[180px] flex-col gap-1.5 rounded-md bg-white/70 p-2.5 backdrop-blur-sm">
        <div
          className="h-8 w-full rounded"
          style={{ background: item.fg, opacity: 0.85 }}
        />
        <div className="h-1.5 w-3/4 rounded-full" style={{ background: item.fg, opacity: 0.6 }} />
        <div className="h-1.5 w-1/2 rounded-full" style={{ background: item.fg, opacity: 0.4 }} />
        <div className="mt-1 grid grid-cols-3 gap-1">
          <div className="aspect-square rounded-sm bg-white" />
          <div className="aspect-square rounded-sm" style={{ background: item.fg, opacity: 0.5 }} />
          <div className="aspect-square rounded-sm bg-white" />
        </div>
      </div>
    </div>
  );
}

function AdMock({ item }: MockProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4">
      <div className="grid w-full max-w-[210px] grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative aspect-[4/3] overflow-hidden rounded-md"
            style={{ background: i % 2 === 0 ? item.fg : "#ffffff" }}
          >
            <div
              className="absolute bottom-1 left-1 h-1 w-3/5 rounded-full"
              style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.7)" : item.fg, opacity: 0.7 }}
            />
          </div>
        ))}
      </div>
      <span className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-ink-50">
        A / B / C / D
      </span>
    </div>
  );
}

function SnsMock({ item }: MockProps) {
  return (
    <div className="flex h-full items-center justify-center gap-1.5 px-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex aspect-[4/5] w-[64px] flex-col justify-between rounded-md p-1.5"
          style={{
            background: i === 1 ? item.fg : "#ffffff",
            border: i === 1 ? "none" : `1px solid ${item.fg}33`,
          }}
        >
          <span
            className="font-display text-[8px] font-bold uppercase tracking-[0.1em]"
            style={{
              color: i === 1 ? "rgba(255,255,255,0.8)" : item.fg,
            }}
          >
            {`0${i + 1}`}
          </span>
          <div
            className="h-1 w-3/4 rounded-full"
            style={{
              background:
                i === 1 ? "rgba(255,255,255,0.7)" : `${item.fg}55`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ThumbMock({ item }: MockProps) {
  return (
    <div className="relative flex h-full items-center justify-center px-4">
      <div
        className="relative flex aspect-video w-full max-w-[200px] items-center justify-center overflow-hidden rounded-md"
        style={{ background: item.fg }}
      >
        <span className="font-display text-[18px] font-extrabold tracking-[-0.5px] text-white">
          BIG IDEA
        </span>
        <span className="absolute bottom-1 right-1 rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold text-white">
          {item.result}
        </span>
      </div>
    </div>
  );
}

function BrandMock({ item }: MockProps) {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="flex items-center gap-3">
        <div
          className="grid h-14 w-14 place-items-center rounded-full"
          style={{ background: item.fg }}
        >
          <div className="h-5 w-5 rounded-full bg-white" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-2 w-20 rounded-full" style={{ background: item.fg }} />
          <div className="h-1.5 w-16 rounded-full" style={{ background: `${item.fg}66` }} />
          <div className="mt-0.5 flex gap-1">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ background: item.fg }}
            />
            <div className="h-3 w-3 rounded-sm bg-white border border-current" style={{ color: `${item.fg}55` }} />
            <div className="h-3 w-3 rounded-sm" style={{ background: `${item.fg}44` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailAltMock({ item }: MockProps) {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="flex w-full max-w-[200px] gap-2">
        <div
          className="h-[112px] w-[60px] shrink-0 rounded-md"
          style={{ background: item.fg }}
        />
        <div className="flex flex-1 flex-col gap-1.5 rounded-md bg-white p-2">
          <div className="font-display text-[9px] font-bold uppercase tracking-[0.1em] text-ink-70">
            {item.label}
          </div>
          <div className="h-1.5 w-3/4 rounded-full bg-ink-15" />
          <div className="h-1.5 w-1/2 rounded-full bg-ink-15" />
          <div className="mt-auto flex items-end justify-between">
            <span className="text-[8px] uppercase tracking-[0.1em] text-ink-50">
              ROAS
            </span>
            <span
              className="font-display text-[14px] font-extrabold"
              style={{ color: item.fg }}
            >
              {item.result.replace(/[^0-9.]/g, "") || "4.1"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
