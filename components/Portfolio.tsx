"use client";

import { useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { CaseStudyModal } from "./CaseStudyModal";
import { portfolio, type PortfolioItem } from "@/lib/site-data";

export function Portfolio() {
  const [open, setOpen] = useState<PortfolioItem | null>(null);

  return (
    <section className="section bg-white" id="portfolio">
      <SectionHeader
        eyebrow="Selected works"
        title="실제로 운영되는 결과물"
        subtitle="브랜드 데이터로 증명된 케이스 중심으로 정리했습니다. 모든 산출물은 시니어 디렉터의 큐레이션을 거쳐 정제되었습니다."
        action={
          <a
            href="#contact"
            className="text-[13px] font-semibold text-iris transition-opacity hover:opacity-80"
          >
            전체 케이스 요청 →
          </a>
        }
      />

      <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {portfolio.map((p, i) => (
          <Reveal key={p.code} delay={i * 0.04}>
            <PortfolioCard item={p} index={i} onOpen={() => setOpen(p)} />
          </Reveal>
        ))}
      </div>

      <CaseStudyModal item={open} onClose={() => setOpen(null)} />
    </section>
  );
}

function PortfolioCard({
  item,
  index,
  onOpen,
}: {
  item: PortfolioItem;
  index: number;
  onOpen: () => void;
}) {
  return (
    <article className="group h-full">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${item.title} · 케이스 자세히 보기`}
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-ink-15 bg-white text-left transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-iris focus-visible:outline-none focus-visible:border-iris focus-visible:ring-2 focus-visible:ring-iris/30"
      >
      <PortfolioThumb item={item} index={index} />

      <div className="flex flex-1 flex-col px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-iris">
            {item.cat}
          </span>
          <span className="text-ink-30">·</span>
          <span className="num font-mono text-[10px] text-ink-50">
            {item.code}
          </span>
          <span className="ml-auto">
            <StatusDot status={item.status} />
          </span>
        </div>

        <h4 className="mt-2 line-clamp-2 font-display text-[14px] font-bold leading-[1.4] text-ink-100">
          {item.title}
        </h4>
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.5] text-ink-50">
          {item.summary}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-ink-15 pt-3">
          {item.metrics.map((m) => (
            <div key={m.label} className="min-w-0">
              <div className="meta-cap font-display text-[9px] font-bold uppercase tracking-[0.08em] text-ink-50">
                {m.label}
              </div>
              <div className="num mt-0.5 truncate font-display text-[13px] font-extrabold tracking-tight text-ink-100">
                {m.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-ink-5 px-2 py-0.5 text-[10px] font-medium text-ink-70">
            {item.client}
          </span>
          <span className="rounded-full bg-ink-5 px-2 py-0.5 text-[10px] font-medium text-ink-70">
            {item.sector}
          </span>
          {item.channels.slice(0, 2).map((c) => (
            <span
              key={c}
              className="rounded-full border border-ink-15 px-2 py-0.5 text-[10px] font-medium text-ink-50"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-ink-15 pt-3 text-[11px] text-ink-50">
          <span>Shipped · {item.shipped}</span>
          <span className="inline-flex items-center gap-2">
            <span className="num font-mono">★ {item.rating}</span>
            <span className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30 transition-colors duration-200 group-hover:text-iris">
              자세히 →
            </span>
          </span>
        </div>
      </div>
      </button>
    </article>
  );
}

function StatusDot({ status }: { status: PortfolioItem["status"] }) {
  const map = {
    Live: { dot: "bg-success", text: "text-success", label: "Live" },
    Ongoing: { dot: "bg-warning", text: "text-warning", label: "Ongoing" },
    Shipped: { dot: "bg-ink-30", text: "text-ink-50", label: "Shipped" },
  } as const;
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1 ${m.text}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${m.dot}`} />
      <span className="font-display text-[10px] font-bold uppercase tracking-[0.08em]">
        {m.label}
      </span>
    </span>
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
      className="relative h-[160px] w-full overflow-hidden"
      style={{ background: item.bg }}
    >
      <Mock item={item} />
      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        <span
          className="rounded-md px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white"
          style={{ background: item.fg }}
        >
          {item.client}
        </span>
      </div>
      <div className="absolute right-3 top-3">
        <span className="rounded-md bg-white/85 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.1em] backdrop-blur-sm" style={{ color: item.fg }}>
          {item.label}
        </span>
      </div>
    </div>
  );
}

type MockProps = { item: PortfolioItem };

function DetailMock({ item }: MockProps) {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="flex w-full max-w-[180px] flex-col gap-1.5 rounded-md bg-white/85 p-2.5 backdrop-blur-sm">
        <div
          className="h-8 w-full rounded"
          style={{ background: item.fg, opacity: 0.85 }}
        />
        <div
          className="h-1.5 w-3/4 rounded-full"
          style={{ background: item.fg, opacity: 0.6 }}
        />
        <div
          className="h-1.5 w-1/2 rounded-full"
          style={{ background: item.fg, opacity: 0.4 }}
        />
        <div className="mt-1 grid grid-cols-3 gap-1">
          <div className="aspect-square rounded-sm bg-white" />
          <div
            className="aspect-square rounded-sm"
            style={{ background: item.fg, opacity: 0.5 }}
          />
          <div className="aspect-square rounded-sm bg-white" />
        </div>
      </div>
    </div>
  );
}

function AdMock({ item }: MockProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4">
      <div className="grid w-full max-w-[220px] grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative aspect-[4/3] overflow-hidden rounded-md"
            style={{ background: i % 2 === 0 ? item.fg : "#ffffff" }}
          >
            <div
              className="absolute bottom-1 left-1 h-1 w-3/5 rounded-full"
              style={{
                background:
                  i % 2 === 0 ? "rgba(255,255,255,0.7)" : item.fg,
                opacity: 0.7,
              }}
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
          className="flex aspect-[4/5] w-[68px] flex-col justify-between rounded-md p-1.5"
          style={{
            background: i === 1 ? item.fg : "#ffffff",
            border: i === 1 ? "none" : `1px solid ${item.fg}33`,
          }}
        >
          <span
            className="font-display text-[8px] font-bold uppercase tracking-[0.1em]"
            style={{
              color: i === 1 ? "rgba(255,255,255,0.85)" : item.fg,
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
        className="relative flex aspect-video w-full max-w-[220px] items-center justify-center overflow-hidden rounded-md"
        style={{ background: item.fg }}
      >
        <span className="font-display text-[20px] font-extrabold tracking-[-0.5px] text-white">
          BIG IDEA
        </span>
        <span className="num absolute bottom-1 right-1 rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold text-white">
          CTR {item.metrics[0]?.value}
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
          <div
            className="h-2 w-20 rounded-full"
            style={{ background: item.fg }}
          />
          <div
            className="h-1.5 w-16 rounded-full"
            style={{ background: `${item.fg}66` }}
          />
          <div className="mt-0.5 flex gap-1">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ background: item.fg }}
            />
            <div
              className="h-3 w-3 rounded-sm border bg-white"
              style={{ borderColor: `${item.fg}55` }}
            />
            <div
              className="h-3 w-3 rounded-sm"
              style={{ background: `${item.fg}44` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailAltMock({ item }: MockProps) {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="flex w-full max-w-[220px] gap-2">
        <div
          className="h-[120px] w-[64px] shrink-0 rounded-md"
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
              className="num font-display text-[14px] font-extrabold"
              style={{ color: item.fg }}
            >
              {item.metrics[0]?.value ?? "4.1×"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
