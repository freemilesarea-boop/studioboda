import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StartCTA } from "@/components/StartCTA";
import { ArrowGlyph } from "@/components/ui/Button";
import { getPortfolioBySlug } from "@/lib/queries/portfolio";
import type { PortfolioImage, PortfolioProof } from "@/lib/types/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const item = await getPortfolioBySlug(params.slug);
  if (!item) return { title: "Portfolio · STUDIO BODA" };
  const description =
    item.result_summary ?? item.description ?? "STUDIO BODA portfolio case";
  return {
    title: `${item.title} · STUDIO BODA`,
    description,
    alternates: {
      canonical: `https://studioboda.kr/portfolio/${item.slug}`,
    },
    openGraph: {
      title: `${item.title} · STUDIO BODA`,
      description,
      url: `https://studioboda.kr/portfolio/${item.slug}`,
      images: item.thumbnail_url ? [{ url: item.thumbnail_url }] : undefined,
    },
    twitter: {
      card: item.thumbnail_url ? "summary_large_image" : "summary",
      title: `${item.title} · STUDIO BODA`,
      description,
      images: item.thumbnail_url ? [item.thumbnail_url] : undefined,
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await getPortfolioBySlug(params.slug);
  if (!item) notFound();

  const gallery: PortfolioImage[] = Array.isArray(item.images) ? item.images : [];
  const publicProof: PortfolioProof[] = (item.proof_files ?? []).filter(
    (p) => !p.internal,
  );
  const metricEntries = Object.entries(item.metrics ?? {});

  return (
    <>
      <Header />
      <main className="pt-24 sm:pt-28 lg:pt-32">
        <article>
          <header className="px-5 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-[960px]">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-1 text-[12px] text-ink-50 hover:text-iris"
              >
                ← 전체 포트폴리오
              </Link>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
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
              <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.12] tracking-[-1px] text-ink-100 sm:text-[38px] lg:text-[46px]">
                {item.title}
              </h1>
              <p className="mt-2 text-[13px] text-ink-50">
                {item.brand_name ? `${item.brand_name} · ` : ""}
                {item.client_name ?? "—"}
                {item.published_at
                  ? ` · ${format(new Date(item.published_at), "yyyy-MM-dd")}`
                  : ""}
              </p>

              {item.thumbnail_url ? (
                <div className="mt-7 overflow-hidden rounded-2xl border border-ink-15 bg-ink-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="block h-auto w-full"
                  />
                </div>
              ) : null}
            </div>
          </header>

          {metricEntries.length > 0 ? (
            <section className="mt-10 px-5 sm:px-8 lg:px-12">
              <div className="mx-auto max-w-[960px]">
                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-ink-15 bg-white p-5 sm:grid-cols-4 sm:p-6">
                  {metricEntries.map(([label, value]) => (
                    <div key={label}>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-50">
                        {label}
                      </p>
                      <p className="num mt-2 font-display text-[22px] font-extrabold tracking-[-0.6px] text-ink-100 sm:text-[26px]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-12 px-5 sm:px-8 lg:px-12">
            <div className="mx-auto grid max-w-[960px] grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
              {item.problem ? (
                <Block label="문제" body={item.problem} />
              ) : null}
              {item.solution ? (
                <Block label="해결" body={item.solution} />
              ) : null}
              {item.result_summary ? (
                <Block label="결과" body={item.result_summary} />
              ) : null}
            </div>
            {item.description ? (
              <div className="mx-auto mt-8 max-w-[960px]">
                <p className="whitespace-pre-wrap text-[14px] leading-[1.75] text-ink-70 sm:text-[15px]">
                  {item.description}
                </p>
              </div>
            ) : null}
          </section>

          {gallery.length > 0 ? (
            <section className="mt-14 px-5 sm:px-8 lg:px-12">
              <div className="mx-auto max-w-[1200px]">
                <h2 className="font-display text-[18px] font-bold text-ink-100">
                  갤러리
                </h2>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {gallery.map((img) => (
                    <li
                      key={img.url}
                      className="overflow-hidden rounded-2xl border border-ink-15 bg-ink-5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.alt ?? item.title}
                        className="block h-auto w-full"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {publicProof.length > 0 ? (
            <section className="mt-14 px-5 sm:px-8 lg:px-12">
              <div className="mx-auto max-w-[960px]">
                <h2 className="font-display text-[18px] font-bold text-ink-100">
                  성과 인증
                </h2>
                <p className="mt-1 text-[12.5px] text-ink-50">
                  실측 데이터·캡처·보고서. 공개 동의된 자료만 노출합니다.
                </p>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {publicProof.map((p) => (
                    <li
                      key={p.url}
                      className="flex items-center gap-3 rounded-xl border border-ink-15 bg-white p-3"
                    >
                      <div className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-ink-15 bg-ink-5">
                        {p.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.url}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <i
                            className="ti ti-file-type-pdf text-[20px] text-ink-50"
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[13px] font-bold text-ink-100">
                          {p.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-50">
                          {p.type}
                        </p>
                      </div>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-ink-15 px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-70 hover:border-ink-30 hover:text-ink-100"
                      >
                        열기
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          <section className="mt-16 px-5 pb-20 sm:px-8 lg:px-12 lg:pb-24">
            <div className="mx-auto max-w-[960px] rounded-2xl border border-ink-15 bg-ink-5 px-5 py-8 text-center sm:py-10">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-iris">
                Make yours
              </p>
              <h3 className="mt-2 font-display text-[20px] font-extrabold tracking-[-0.5px] text-ink-100 sm:text-[24px]">
                비슷한 프로젝트를 만들어볼까요?
              </h3>
              <p className="mt-2 text-[13.5px] text-ink-70">
                평균 24시간 내 1차 초안을 보내드립니다.
              </p>
              <div className="mt-5 flex justify-center">
                <StartCTA size="lg" variant="cinematic">
                  프로젝트 문의하기 <ArrowGlyph />
                </StartCTA>
              </div>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-50">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-[14px] leading-[1.75] text-ink-100 sm:text-[14.5px]">
        {body}
      </p>
    </div>
  );
}
