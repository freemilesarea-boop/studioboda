import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";
import { StartCTA } from "@/components/StartCTA";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "회사소개 · STUDIO BODA",
  description:
    "STUDIO BODA는 AI가 초안을 잡고 시니어 디렉터가 완성하는 콘텐츠 제작 스튜디오입니다. 상세페이지, 광고, SNS, 썸네일, 브랜드 디자인을 빠르고 일관된 품질로 제작합니다.",
  openGraph: {
    title: "회사소개 · STUDIO BODA",
    description:
      "AI 자동화와 디렉터의 큐레이션으로 브랜드의 콘텐츠를 빠르게 완성하는 크리에이티브 스튜디오.",
    type: "website",
  },
};

const values = [
  {
    icon: "ti-bolt",
    title: "속도",
    desc: "AI 초안 파이프라인으로 제작 리드타임을 단축합니다. 보통 영업일 기준 24시간 안에 첫 시안을 받아볼 수 있습니다.",
  },
  {
    icon: "ti-diamond",
    title: "품질",
    desc: "AI가 만든 초안을 시니어 디렉터가 직접 큐레이션하고 다듬어, 브랜드 톤에 맞는 완성도를 보장합니다.",
  },
  {
    icon: "ti-eye-check",
    title: "투명성",
    desc: "견적·일정·진행 상황을 명확하게 공유합니다. 추가 비용이나 모호한 단계 없이 합의된 범위대로 진행합니다.",
  },
  {
    icon: "ti-chart-dots",
    title: "데이터 기반",
    desc: "광고 효율과 전환을 기준으로 설계합니다. 감각에만 의존하지 않고 데이터로 의사결정을 보완합니다.",
  },
] as const;

const processSteps = [
  { no: "01", title: "문의 · 상담", desc: "필요한 콘텐츠와 목표를 듣고 방향을 잡습니다." },
  { no: "02", title: "견적 · 계약", desc: "투명한 견적을 제시하고 범위를 확정합니다." },
  { no: "03", title: "제작 · 검수", desc: "AI 초안을 디렉터가 다듬고 함께 검수합니다." },
  { no: "04", title: "오픈 · 유지보수", desc: "결과물을 전달하고 이후 운영을 지원합니다." },
] as const;

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pb-16 lg:pt-12">
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
            About {company.name}
          </p>
          <h1 className="mt-3 max-w-[820px] font-display text-[38px] font-extrabold leading-[1.1] tracking-display text-ink-100 sm:text-[44px] lg:text-[52px]">
            AI가 초안을 잡고,
            <br />
            디렉터가 완성합니다.
          </h1>
          <p className="mt-5 max-w-[640px] text-[14px] leading-body text-ink-70 sm:text-[15px]">
            {company.name}({company.korName})는 브랜드가 매일 필요로 하는 콘텐츠를 빠르고 일관된
            품질로 만드는 크리에이티브 스튜디오입니다. AI 자동화 파이프라인과 시니어 디렉터의
            큐레이션을 결합해, 속도와 완성도를 동시에 추구합니다.
          </p>
          <div className="mt-7">
            <StartCTA size="lg" authedHref="/#inquiry">
              무료 견적 받기 →
            </StartCTA>
          </div>
        </section>

        {/* 브랜드 소개 */}
        <section className="border-t border-ink-15 bg-ink-5 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-ink-50">
            Brand
          </p>
          <h2 className="mt-2 max-w-[720px] font-display text-[22px] font-extrabold tracking-tightish text-ink-100 sm:text-[26px]">
            브랜드 소개
          </h2>
          <p className="mt-4 max-w-[680px] text-[14px] leading-body text-ink-70 sm:text-[15px]">
            {company.name}는 AI가 초안을 잡고 디렉터가 완성하는 콘텐츠 제작 스튜디오입니다. 상세페이지,
            광고 배너, SNS 콘텐츠, 썸네일, 브랜드 디자인까지 — 브랜드 운영에 가장 자주 쓰이는 비주얼
            자산을 한곳에서 제작합니다.
          </p>
          <p className="mt-3 max-w-[680px] text-[14px] leading-body text-ink-70 sm:text-[15px]">
            반복적인 작업은 AI 파이프라인이 빠르게 처리하고, 브랜드의 결을 결정짓는 판단은 시니어
            디렉터가 책임집니다. 덕분에 큰 비용 부담 없이도 꾸준하고 높은 품질의 콘텐츠를 받아볼 수
            있습니다.
          </p>
        </section>

        {/* 대표 인사말 */}
        <section className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-ink-50">
            Greeting
          </p>
          <h2 className="mt-2 font-display text-[22px] font-extrabold tracking-tightish text-ink-100 sm:text-[26px]">
            대표 인사말
          </h2>
          <div className="mt-6 max-w-[720px] rounded-2xl border border-ink-15 bg-white p-6 sm:p-8">
            <p className="text-[14px] leading-body text-ink-70 sm:text-[15px]">
              안녕하세요. {company.name}를 찾아주셔서 감사합니다.
            </p>
            <p className="mt-3 text-[14px] leading-body text-ink-70 sm:text-[15px]">
              좋은 콘텐츠는 더 이상 큰 예산과 긴 시간의 전유물이 아니라고 믿습니다. 우리는 AI의
              속도와 사람의 안목을 결합해, 어떤 규모의 브랜드든 자신의 이야기를 또렷하게 전할 수 있게
              돕고자 합니다.
            </p>
            <p className="mt-3 text-[14px] leading-body text-ink-70 sm:text-[15px]">
              앞으로도 빠르고 정직하게, 그리고 데이터로 증명되는 결과로 함께하겠습니다. 여러분의
              브랜드가 가장 좋은 모습으로 보여질 수 있도록 최선을 다하겠습니다.
            </p>
            <p className="mt-6 font-display text-[14px] font-bold text-ink-100">
              {company.representativeName
                ? `${company.name} 대표 ${company.representativeName}`
                : `${company.name} 대표`}
            </p>
          </div>
        </section>

        {/* 비전 */}
        <section className="border-t border-ink-15 bg-ink-100 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
            Vision
          </p>
          <h2 className="mt-3 max-w-[760px] font-display text-[26px] font-extrabold leading-[1.15] tracking-display text-white sm:text-[32px] lg:text-[38px]">
            모든 브랜드가 빠르고 합리적인 비용으로
            <br />
            최고 수준의 콘텐츠를 가질 수 있는 세상.
          </h2>
          <p className="mt-5 max-w-[620px] text-[14px] leading-body text-white/70 sm:text-[15px]">
            우리는 AI와 디렉터의 협업으로 콘텐츠 제작의 기준을 새롭게 정의하고, 브랜드의 성장에 가장
            든든한 제작 파트너가 되는 것을 목표로 합니다.
          </p>
        </section>

        {/* 핵심 가치 */}
        <section className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-ink-50">
            Core Values
          </p>
          <h2 className="mt-2 font-display text-[22px] font-extrabold tracking-tightish text-ink-100 sm:text-[26px]">
            핵심 가치
          </h2>
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="flex h-full flex-col rounded-2xl border border-ink-15 bg-white p-6"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-iris-light text-iris">
                  <i className={`ti ${v.icon} text-[18px]`} aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-[18px] font-extrabold tracking-tightish text-ink-100">
                  {v.title}
                </h3>
                <p className="mt-2 text-[13px] leading-body text-ink-70">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 업무 프로세스 */}
        <section className="border-t border-ink-15 bg-ink-5 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-ink-50">
                Process
              </p>
              <h2 className="mt-2 font-display text-[22px] font-extrabold tracking-tightish text-ink-100 sm:text-[26px]">
                업무 프로세스
              </h2>
            </div>
            <Link
              href="/process"
              className="text-[12.5px] font-semibold text-iris transition-opacity hover:opacity-80"
            >
              자세한 제작 프로세스 보기 →
            </Link>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((s) => (
              <div
                key={s.no}
                className="flex h-full flex-col rounded-2xl border border-ink-15 bg-white p-6"
              >
                <span className="num font-display text-[24px] font-extrabold tracking-display text-iris">
                  {s.no}
                </span>
                <h3 className="mt-3 font-display text-[16px] font-extrabold tracking-tightish text-ink-100">
                  {s.title}
                </h3>
                <p className="mt-2 text-[13px] leading-body text-ink-70">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 py-14 text-center sm:px-8 lg:px-12 lg:py-20">
          <h2 className="mx-auto max-w-[560px] font-display text-[24px] font-extrabold leading-[1.15] tracking-display text-ink-100 sm:text-[30px]">
            지금 바로 시작해볼까요?
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] text-[14px] leading-body text-ink-70">
            필요한 콘텐츠를 알려주시면 빠르게 견적을 보내드립니다. 문의는 {company.email}로도 가능합니다.
          </p>
          <div className="mt-7 flex justify-center">
            <StartCTA size="lg" authedHref="/#inquiry">
              무료 견적 받기 →
            </StartCTA>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}
