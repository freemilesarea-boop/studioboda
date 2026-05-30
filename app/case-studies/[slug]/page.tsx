import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";
import { getCaseStudyBySlug } from "@/lib/queries/case-studies";
import type { CaseStudySection } from "@/lib/types/db";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getCaseStudyBySlug(params.slug);
  if (!data) return { title: "성공사례 · STUDIO BODA" };
  const { caseStudy } = data;
  const description =
    caseStudy.subtitle ??
    caseStudy.summary ??
    caseStudy.result_summary ??
    "STUDIO BODA 성공사례";
  return {
    title: `${caseStudy.title} · STUDIO BODA`,
    description,
    alternates: {
      canonical: `https://studioboda.kr/case-studies/${caseStudy.slug}`,
    },
    openGraph: {
      title: `${caseStudy.title} · STUDIO BODA`,
      description,
      url: `https://studioboda.kr/case-studies/${caseStudy.slug}`,
      images: caseStudy.cover_url
        ? [{ url: caseStudy.cover_url }]
        : caseStudy.thumbnail_url
        ? [{ url: caseStudy.thumbnail_url }]
        : undefined,
    },
    twitter: {
      card:
        caseStudy.cover_url || caseStudy.thumbnail_url
          ? "summary_large_image"
          : "summary",
      title: `${caseStudy.title} · STUDIO BODA`,
      description,
      images: caseStudy.cover_url
        ? [caseStudy.cover_url]
        : caseStudy.thumbnail_url
        ? [caseStudy.thumbnail_url]
        : undefined,
    },
  };
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getCaseStudyBySlug(params.slug);
  if (!data) notFound();

  const { caseStudy, sections } = data;
  const orderedSections = [...sections].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const processSections = orderedSections.filter((s) => s.heading || s.body);
  const metrics = caseStudy.metrics ?? [];
  const techStack = caseStudy.tech_stack ?? [];

  return (
    <>
      <Header />
      <main className="pt-24 sm:pt-28 lg:pt-32">
        <article>
          {/* Hero / cover */}
          <header className="px-5 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-[960px]">
              <Link
                href="/case-studies"
                className="inline-flex items-center gap-1 text-[12px] text-ink-50 hover:text-iris"
              >
                ← 전체 성공사례
              </Link>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
                {caseStudy.category ? (
                  <span className="rounded-full bg-iris/10 px-2 py-0.5 font-mono uppercase tracking-[0.12em] text-iris">
                    {caseStudy.category}
                  </span>
                ) : null}
                {caseStudy.service_type ? (
                  <span className="text-ink-50">{caseStudy.service_type}</span>
                ) : null}
              </div>
              <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.12] tracking-[-1px] text-ink-100 sm:text-[38px] lg:text-[46px]">
                {caseStudy.title}
              </h1>
              {caseStudy.subtitle ? (
                <p className="mt-3 max-w-[680px] text-[15px] leading-[1.7] text-ink-70 sm:text-[16px]">
                  {caseStudy.subtitle}
                </p>
              ) : null}
              {caseStudy.client_name ? (
                <p className="mt-2 text-[13px] text-ink-50">
                  {caseStudy.client_name}
                </p>
              ) : null}

              <div className="mt-7 overflow-hidden rounded-2xl border border-ink-15 bg-ink-5">
                {caseStudy.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={caseStudy.cover_url}
                    alt={caseStudy.title}
                    fetchPriority="high"
                    decoding="async"
                    className="block h-auto w-full"
                  />
                ) : (
                  <div className="aspect-[16/7] w-full bg-gradient-to-br from-iris/25 via-ink-5 to-ink-15" />
                )}
              </div>
            </div>
          </header>

          {/* 프로젝트 개요 */}
          {caseStudy.summary ? (
            <Section heading="프로젝트 개요" body={caseStudy.summary} />
          ) : null}

          {/* 문제점 */}
          {caseStudy.problem ? (
            <Section heading="문제점" body={caseStudy.problem} />
          ) : null}

          {/* 해결 방법 */}
          {caseStudy.solution ? (
            <Section heading="해결 방법" body={caseStudy.solution} />
          ) : null}

          {/* 제작 과정 */}
          {processSections.length > 0 ? (
            <section className="mt-14 px-5 sm:px-8 lg:px-12">
              <div className="mx-auto max-w-[960px]">
                <h2 className="font-display text-[20px] font-extrabold tracking-[-0.5px] text-ink-100 sm:text-[24px]">
                  제작 과정
                </h2>
                <div className="mt-5 space-y-6">
                  {processSections.map((s: CaseStudySection) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-ink-15 bg-white p-5 sm:p-6"
                    >
                      {s.heading ? (
                        <h3 className="font-display text-[15px] font-bold text-ink-100 sm:text-[16px]">
                          {s.heading}
                        </h3>
                      ) : null}
                      {s.body ? (
                        <p className="mt-2 whitespace-pre-wrap text-[14px] leading-[1.75] text-ink-70 sm:text-[14.5px]">
                          {s.body}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* 결과 */}
          {caseStudy.result_summary ? (
            <Section heading="결과" body={caseStudy.result_summary} />
          ) : null}

          {/* 지표 (매출/전환율/방문자 등) */}
          {metrics.length > 0 ? (
            <section className="mt-12 px-5 sm:px-8 lg:px-12">
              <div className="mx-auto max-w-[960px]">
                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-ink-15 bg-white p-5 sm:grid-cols-3 sm:p-6">
                  {metrics.map((m) => (
                    <div key={m.label}>
                      <p className="num font-display text-[24px] font-extrabold tracking-[-0.8px] text-ink-100 sm:text-[30px]">
                        {m.value}
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-ink-70">
                        {m.label}
                      </p>
                      {m.delta ? (
                        <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-iris">
                          {m.delta}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* 사용 기술 */}
          {techStack.length > 0 ? (
            <section className="mt-12 px-5 sm:px-8 lg:px-12">
              <div className="mx-auto max-w-[960px]">
                <h2 className="font-display text-[20px] font-extrabold tracking-[-0.5px] text-ink-100 sm:text-[24px]">
                  사용 기술
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {techStack.map((t) => (
                    <li
                      key={t}
                      className="rounded-full border border-ink-15 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-70"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* Bottom CTA */}
          <section className="mt-16 px-5 pb-20 sm:px-8 lg:px-12 lg:pb-24">
            <div className="mx-auto max-w-[960px] rounded-2xl border border-ink-15 bg-ink-5 px-5 py-8 text-center sm:py-10">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-iris">
                Make yours
              </p>
              <h3 className="mt-2 font-display text-[20px] font-extrabold tracking-[-0.5px] text-ink-100 sm:text-[24px]">
                비슷한 결과를 만들어볼까요?
              </h3>
              <p className="mt-2 text-[13.5px] text-ink-70">
                평균 24시간 내 1차 초안을 보내드립니다.
              </p>
              <div className="mt-5 flex justify-center">
                <Link
                  href="/#inquiry"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink-100 px-6 font-display text-[14px] font-bold text-white hover:bg-ink-90"
                >
                  프로젝트 문의하기 →
                </Link>
              </div>
            </div>
          </section>
        </article>
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}

function Section({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="mt-12 px-5 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[960px]">
        <h2 className="font-display text-[20px] font-extrabold tracking-[-0.5px] text-ink-100 sm:text-[24px]">
          {heading}
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.75] text-ink-70 sm:text-[15px]">
          {body}
        </p>
      </div>
    </section>
  );
}
