import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { listPublishedPortfolio } from "@/lib/queries/portfolio";
import type { PortfolioItem } from "@/lib/types/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfolio · STUDIO BODA",
  description:
    "STUDIO BODA가 실제로 운영한 상세페이지·광고 배너·SNS 콘텐츠 결과물을 모았습니다.",
  alternates: { canonical: "https://studioboda.kr/portfolio" },
  openGraph: {
    title: "Portfolio · STUDIO BODA",
    description:
      "STUDIO BODA가 실제로 운영한 상세페이지·광고 배너·SNS 콘텐츠 결과물.",
    url: "https://studioboda.kr/portfolio",
  },
};

type SearchParams = { category?: string; service?: string };

function uniqueValues(items: PortfolioItem[], field: keyof PortfolioItem) {
  const set = new Set<string>();
  for (const i of items) {
    const v = i[field];
    if (typeof v === "string" && v.trim()) set.add(v.trim());
  }
  return Array.from(set).sort();
}

export default async function PortfolioListPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const all = await listPublishedPortfolio();
  const categories = uniqueValues(all, "category");
  const services = uniqueValues(all, "service_type");
  const activeCategory = searchParams?.category ?? "";
  const activeService = searchParams?.service ?? "";

  const filtered = all.filter(
    (it) =>
      (!activeCategory || it.category === activeCategory) &&
      (!activeService || it.service_type === activeService),
  );

  return (
    <>
      <Header />
      <main className="pt-24 sm:pt-28 lg:pt-32">
        <section className="px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1200px]">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-iris">
              Selected works
            </p>
            <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.15] tracking-[-1px] text-ink-100 sm:text-[36px] lg:text-[42px]">
              실제로 운영되는 결과물
            </h1>
            <p className="mt-4 max-w-[640px] text-[15px] leading-[1.7] text-ink-70 sm:text-[16px]">
              상세페이지, 광고 배너, SNS 콘텐츠까지 실제 제작 흐름에 맞춰 정리한
              결과물입니다.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <FilterRow
                label="카테고리"
                values={categories}
                param="category"
                active={activeCategory}
                otherParam="service"
                otherValue={activeService}
              />
              <span className="h-4 w-px bg-ink-15" />
              <FilterRow
                label="서비스"
                values={services}
                param="service"
                active={activeService}
                otherParam="category"
                otherValue={activeCategory}
              />
            </div>
          </div>
        </section>

        <section className="mt-9 px-5 pb-20 sm:px-8 lg:px-12 lg:pb-24">
          <div className="mx-auto max-w-[1200px]">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-16 text-center">
                <p className="font-display text-[14px] font-bold text-ink-100">
                  공개된 케이스가 없습니다
                </p>
                <p className="mt-1 text-[12.5px] text-ink-50">
                  곧 새 결과물이 업데이트됩니다.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((it) => (
                  <li key={it.id}>
                    <PortfolioCard item={it} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FilterRow({
  label,
  values,
  param,
  active,
  otherParam,
  otherValue,
}: {
  label: string;
  values: string[];
  param: string;
  active: string;
  otherParam: string;
  otherValue: string;
}) {
  if (values.length === 0) return null;
  const link = (value: string) => {
    const qs = new URLSearchParams();
    if (value) qs.set(param, value);
    if (otherValue) qs.set(otherParam, otherValue);
    return qs.toString() ? `?${qs}` : "/portfolio";
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-50">
        {label}
      </span>
      <Link
        href={link("")}
        className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
          !active
            ? "border-ink-100 bg-ink-100 text-white"
            : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
        }`}
      >
        전체
      </Link>
      {values.map((v) => (
        <Link
          key={v}
          href={link(v)}
          className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
            active === v
              ? "border-ink-100 bg-ink-100 text-white"
              : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
          }`}
        >
          {v}
        </Link>
      ))}
    </div>
  );
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const metrics = Object.entries(item.metrics ?? {}).slice(0, 2);
  return (
    <Link
      href={`/portfolio/${item.slug}`}
      className="card-cinematic block overflow-hidden rounded-2xl border border-ink-15 bg-white"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-5">
        {item.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center text-ink-30">
            <i className="ti ti-photo text-[28px]" aria-hidden />
          </div>
        )}
        {item.is_featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink-100/90 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            Featured
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {item.service_type ? (
            <span className="font-mono uppercase tracking-[0.14em] text-iris">
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
        <h3 className="line-clamp-2 font-display text-[16px] font-bold leading-[1.4] text-ink-100">
          {item.title}
        </h3>
        {item.result_summary || item.description ? (
          <p className="line-clamp-2 text-[12.5px] leading-[1.55] text-ink-70">
            {item.result_summary ?? item.description}
          </p>
        ) : null}
        {metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 border-t border-ink-15 pt-3">
            {metrics.map(([label, value]) => (
              <div key={label}>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-50">
                  {label}
                </p>
                <p className="num mt-0.5 font-display text-[15px] font-extrabold tracking-[-0.4px] text-ink-100">
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
