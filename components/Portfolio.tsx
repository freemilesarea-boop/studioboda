import Link from "next/link";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { listPublishedPortfolio } from "@/lib/queries/portfolio";
import type { PortfolioItem } from "@/lib/types/db";

export async function Portfolio() {
  const items = await listPublishedPortfolio({ featuredOnly: true, limit: 6 });
  if (items.length === 0) return null;

  return (
    <section className="section bg-white" id="portfolio">
      <SectionHeader
        eyebrow="Selected works"
        title="실제로 운영되는 결과물"
        subtitle="상세페이지, 광고 배너, SNS 콘텐츠까지 실제 제작 흐름에 맞춰 정리한 결과물입니다."
        action={
          <Link
            href="/portfolio"
            className="font-display text-[12.5px] font-bold text-iris hover:underline"
          >
            전체 보기 →
          </Link>
        }
      />

      <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.04}>
            <PortfolioCard item={item} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const metrics = Object.entries(item.metrics ?? {}).slice(0, 3);
  return (
    <Link
      href={`/portfolio/${item.slug}`}
      className="card-cinematic group block h-full overflow-hidden rounded-2xl border border-ink-15 bg-white"
      aria-label={`${item.title} · 케이스 자세히 보기`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-5">
        {item.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
          />
        ) : (
          <div className="grid h-full place-items-center text-ink-30">
            <i className="ti ti-photo text-[28px]" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        <div className="flex items-center gap-2 text-[11px]">
          {item.service_type ? (
            <span className="font-mono font-bold uppercase tracking-[0.1em] text-iris">
              {item.service_type}
            </span>
          ) : null}
          {item.category ? (
            <>
              <span className="text-ink-30">·</span>
              <span className="text-ink-50">{item.category}</span>
            </>
          ) : null}
        </div>
        <h4 className="mt-2 line-clamp-2 font-display text-[14.5px] font-bold leading-[1.4] text-ink-100">
          {item.title}
        </h4>
        {item.result_summary || item.description ? (
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.55] text-ink-50">
            {item.result_summary ?? item.description}
          </p>
        ) : null}

        {metrics.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-ink-15 pt-3">
            {metrics.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-50">
                  {label}
                </p>
                <p className="num mt-0.5 truncate font-display text-[13px] font-extrabold tracking-tight text-ink-100">
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
