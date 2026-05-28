import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";
import { StartCTA } from "@/components/StartCTA";
import {
  listPrimaryServices,
  listSecondaryServices,
} from "@/lib/queries/services";
import { SERVICE_CATEGORY_LABELS, type Service } from "@/lib/types/db";

export const metadata: Metadata = {
  title: "서비스 · STUDIO BODA",
  description:
    "STUDIO BODA의 5대 핵심 서비스 — 상세페이지, SNS 콘텐츠, 광고 배너, 썸네일, 브랜드 디자인. AI 자동화 + 시니어 디렉터 큐레이션.",
  openGraph: {
    title: "STUDIO BODA · 서비스 라인업",
    description:
      "감각적인 비주얼과 광고 효율 중심의 설계를 빠른 속도로. AI 크리에이티브 스튜디오.",
    type: "website",
  },
};

export const revalidate = 60;

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export default async function ServicesPage() {
  const [primary, secondary] = await Promise.all([
    listPrimaryServices(),
    listSecondaryServices(),
  ]);

  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pb-16 lg:pt-12">
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
            Service Lineup
          </p>
          <h1 className="mt-3 max-w-[820px] font-display text-[38px] font-extrabold leading-[1.1] tracking-display text-ink-100 sm:text-[44px] lg:text-[52px]">
            감각적인 비주얼과 광고 효율을
            <br />
            <span className="bg-iris-text bg-clip-text text-transparent [-webkit-background-clip:text]">
              24시간
            </span>{" "}
            안에.
          </h1>
          <p className="mt-5 max-w-[640px] text-[14px] leading-body text-ink-70 sm:text-[15px]">
            AI 자동화 파이프라인과 시니어 디렉터의 큐레이션으로 콘텐츠 · 광고 · 브랜드 자산을
            제작합니다. 5대 핵심 서비스를 기본으로, 패키지와 정기 구독 옵션도 함께 제공합니다.
          </p>
          <div className="mt-7">
            <StartCTA size="lg">무료 견적 받기 →</StartCTA>
          </div>
        </section>

        <section className="px-5 pb-12 sm:px-8 lg:px-12 lg:pb-16">
          <header className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-ink-50">
                Primary · 핵심 5종
              </p>
              <h2 className="mt-2 font-display text-[22px] font-extrabold tracking-tightish text-ink-100 sm:text-[26px]">
                브랜드 운영의 가장 자주 쓰이는 콘텐츠
              </h2>
            </div>
          </header>

          {primary.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {primary.map((s) => (
                <ServiceCard key={s.id} s={s} />
              ))}
            </div>
          )}
        </section>

        {secondary.length > 0 && (
          <section className="border-t border-ink-15 bg-ink-5 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <header className="mb-7">
              <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-ink-50">
                Packages & Subscriptions
              </p>
              <h2 className="mt-2 font-display text-[22px] font-extrabold tracking-tightish text-ink-100 sm:text-[26px]">
                패키지 · 정기 구독
              </h2>
              <p className="mt-2 max-w-[560px] text-[13px] leading-body text-ink-70">
                풀브랜드 패키지, 회사소개서, 월 단위 운영 등 더 큰 단위로 진행하는 옵션입니다.
              </p>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {secondary.map((s) => (
                <ServiceCard key={s.id} s={s} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}

function ServiceCard({ s }: { s: Service }) {
  const categoryLabel = SERVICE_CATEGORY_LABELS[s.category] ?? s.category;
  return (
    <Link
      href={`/services/${s.key}`}
      className={`group flex h-full flex-col rounded-2xl border bg-white p-6 transition-colors duration-200 hover:border-iris/60 ${
        s.featured ? "border-iris/40 shadow-[0_12px_40px_-24px_rgba(91,71,255,0.45)]" : "border-ink-15"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-iris-light text-iris">
          <i className={`ti ${s.icon ?? "ti-sparkles"} text-[18px]`} aria-hidden />
        </span>
        <div className="flex items-center gap-1.5">
          {s.badge ? (
            <span className="rounded-full bg-iris-light px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption text-iris">
              {s.badge}
            </span>
          ) : null}
          <span className="rounded-full bg-ink-5 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption text-ink-70">
            {categoryLabel}
          </span>
        </div>
      </div>
      <h3 className="mt-5 font-display text-[18px] font-extrabold tracking-tightish text-ink-100">
        {s.name}
        {s.name_en ? (
          <span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-caption text-ink-50">
            {s.name_en}
          </span>
        ) : null}
      </h3>
      {s.description ? (
        <p className="mt-2 line-clamp-3 text-[13px] leading-body text-ink-70">
          {s.description}
        </p>
      ) : null}

      <div className="mt-5 flex items-baseline justify-between border-t border-ink-15 pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-caption text-ink-50">
            시작가
          </p>
          <p className="num mt-0.5 font-display text-[18px] font-extrabold tracking-tightish text-ink-100">
            {fmt(s.base_price)}원~
          </p>
        </div>
        <span className="text-[11.5px] font-semibold text-ink-50 transition-colors group-hover:text-iris">
          자세히 보기 →
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-ink-15 bg-white p-10 text-center">
      <i className="ti ti-database-off text-[28px] text-ink-30" aria-hidden />
      <p className="mt-3 font-display text-[14px] font-bold text-ink-100">
        서비스 데이터를 불러오지 못했습니다
      </p>
      <p className="mt-1 text-[12px] text-ink-50">
        잠시 후 다시 시도해주세요. 문의는 hello@studioboda.kr.
      </p>
    </div>
  );
}
