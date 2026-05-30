import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";
import { listPublishedCaseStudies } from "@/lib/queries/case-studies";
import type { CaseStudy } from "@/lib/types/db";

// ISR — public listing. Admin edits surface within 60s.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "성공사례 · STUDIO BODA",
  description:
    "STUDIO BODA와 함께한 브랜드들의 매출·전환율·방문자 성장 성공사례를 확인하세요.",
  alternates: { canonical: "https://studioboda.kr/case-studies" },
  openGraph: {
    title: "성공사례 · STUDIO BODA",
    description:
      "STUDIO BODA와 함께한 브랜드들의 매출·전환율·방문자 성장 성공사례.",
    url: "https://studioboda.kr/case-studies",
  },
};

export default async function CaseStudiesListPage() {
  const items = await listPublishedCaseStudies();

  return (
    <>
      <Header />
      <main className="pt-24 sm:pt-28 lg:pt-32">
        <section className="px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1200px]">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-iris">
              Case Studies
            </p>
            <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.15] tracking-[-1px] text-ink-100 sm:text-[36px] lg:text-[42px]">
              성공사례
            </h1>
            <p className="mt-4 max-w-[640px] text-[15px] leading-[1.7] text-ink-70 sm:text-[16px]">
              실제 프로젝트에서 만들어낸 매출, 전환율, 방문자 성장 결과를
              정리했습니다.
            </p>
          </div>
        </section>

        <section className="mt-9 px-5 pb-20 sm:px-8 lg:px-12 lg:pb-24">
          <div className="mx-auto max-w-[1200px]">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-16 text-center">
                <p className="font-display text-[14px] font-bold text-ink-100">
                  공개된 성공사례가 없습니다
                </p>
                <p className="mt-1 text-[12.5px] text-ink-50">
                  곧 새 사례가 업데이트됩니다.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it) => (
                  <li key={it.id}>
                    <CaseStudyCard item={it} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}

function CaseStudyCard({ item }: { item: CaseStudy }) {
  const metrics = (item.metrics ?? []).slice(0, 2);
  return (
    <Link
      href={`/case-studies/${item.slug}`}
      className="card-cinematic group block overflow-hidden rounded-2xl border border-ink-15 bg-white"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-5">
        {item.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail_url}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-iris/20 via-ink-5 to-ink-15" />
        )}
        {item.is_featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink-100/90 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            Featured
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {item.category ? (
            <span className="rounded-full bg-iris/10 px-2 py-0.5 font-mono uppercase tracking-[0.12em] text-iris">
              {item.category}
            </span>
          ) : null}
          {item.client_name ? (
            <span className="text-ink-50">{item.client_name}</span>
          ) : null}
        </div>
        <h3 className="line-clamp-2 font-display text-[16px] font-bold leading-[1.4] text-ink-100">
          {item.title}
        </h3>
        {item.subtitle ? (
          <p className="line-clamp-2 text-[12.5px] leading-[1.55] text-ink-70">
            {item.subtitle}
          </p>
        ) : null}
        {metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 border-t border-ink-15 pt-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="num font-display text-[15px] font-extrabold tracking-[-0.4px] text-ink-100">
                  {m.value}
                </p>
                <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-50">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
