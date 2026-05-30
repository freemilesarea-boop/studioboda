import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";
import { StartCTA } from "@/components/StartCTA";

export const metadata: Metadata = {
  title: "제작 프로세스 · STUDIO BODA",
  description:
    "STUDIO BODA의 8단계 제작 프로세스 — 문의, 상담, 견적, 계약, 제작, 검수, 오픈, 유지보수. 각 단계에서 무엇이 진행되고 무엇을 기대할 수 있는지 안내합니다.",
  openGraph: {
    title: "제작 프로세스 · STUDIO BODA",
    description:
      "문의부터 유지보수까지, 투명하고 빠른 8단계 콘텐츠 제작 프로세스를 안내합니다.",
    type: "website",
  },
};

const steps = [
  {
    no: 1,
    icon: "ti-message-circle",
    title: "문의",
    desc: "필요한 콘텐츠와 일정, 예산을 간단히 남겨주세요. 폼 또는 이메일로 접수되며, 영업일 기준 빠르게 회신드립니다.",
  },
  {
    no: 2,
    icon: "ti-headset",
    title: "상담",
    desc: "목표와 레퍼런스를 함께 정리하며 방향을 잡습니다. 어떤 결과물이 필요한지 명확히 합의하는 단계입니다.",
  },
  {
    no: 3,
    icon: "ti-receipt",
    title: "견적",
    desc: "확정된 범위에 맞춰 투명한 견적을 제시합니다. 항목별 비용과 일정을 명확히 안내해 추가 비용 부담을 없앱니다.",
  },
  {
    no: 4,
    icon: "ti-file-check",
    title: "계약",
    desc: "작업 범위·일정·비용을 문서로 확정합니다. 합의된 내용이 곧 작업 기준이 되어 이후 진행이 명확해집니다.",
  },
  {
    no: 5,
    icon: "ti-wand",
    title: "제작",
    desc: "AI 파이프라인이 초안을 빠르게 잡고, 시니어 디렉터가 브랜드 톤에 맞춰 완성합니다. 진행 상황을 공유드립니다.",
  },
  {
    no: 6,
    icon: "ti-eye-check",
    title: "검수",
    desc: "시안을 함께 검토하고 피드백을 반영합니다. 합의된 범위 안에서 수정을 진행해 완성도를 끌어올립니다.",
  },
  {
    no: 7,
    icon: "ti-rocket",
    title: "오픈",
    desc: "최종 결과물을 사용 가능한 형식으로 전달합니다. 채널에 맞는 규격과 원본 파일을 함께 제공합니다.",
  },
  {
    no: 8,
    icon: "ti-refresh",
    title: "유지보수",
    desc: "오픈 이후의 수정 요청과 운영을 지원합니다. 정기 구독으로 지속적인 콘텐츠 운영도 가능합니다.",
  },
] as const;

export default function ProcessPage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pb-16 lg:pt-12">
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
            How we work
          </p>
          <h1 className="mt-3 max-w-[820px] font-display text-[38px] font-extrabold leading-[1.1] tracking-display text-ink-100 sm:text-[44px] lg:text-[52px]">
            문의부터 유지보수까지,
            <br />
            8단계로 투명하게.
          </h1>
          <p className="mt-5 max-w-[640px] text-[14px] leading-body text-ink-70 sm:text-[15px]">
            STUDIO BODA는 문의 · 상담 · 견적 · 계약 · 제작 · 검수 · 오픈 · 유지보수의 8단계로
            진행합니다. 각 단계에서 무엇이 일어나고 무엇을 기대할 수 있는지 미리 안내해, 처음
            맡기는 분도 안심하고 진행할 수 있습니다.
          </p>
          <div className="mt-7">
            <StartCTA size="lg" authedHref="/#inquiry">
              무료 견적 받기 →
            </StartCTA>
          </div>
        </section>

        {/* Timeline */}
        <section className="px-5 pb-12 sm:px-8 lg:px-12 lg:pb-16">
          <ol className="relative ml-3 border-l border-ink-15 sm:ml-5">
            {steps.map((s) => (
              <li key={s.no} className="relative pb-8 pl-8 last:pb-0 sm:pl-10">
                {/* Node */}
                <span className="absolute -left-[17px] top-0 grid h-8 w-8 place-items-center rounded-full border border-iris/30 bg-iris-light font-display text-[13px] font-extrabold text-iris sm:-left-[19px] sm:h-9 sm:w-9 sm:text-[14px]">
                  {s.no}
                </span>
                <div className="rounded-2xl border border-ink-15 bg-white p-6">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-5 text-ink-70">
                      <i className={`ti ${s.icon} text-[16px]`} aria-hidden />
                    </span>
                    <h2 className="font-display text-[18px] font-extrabold tracking-tightish text-ink-100">
                      {s.title}
                    </h2>
                  </div>
                  <p className="mt-3 text-[13px] leading-body text-ink-70 sm:text-[14px]">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="border-t border-ink-15 bg-ink-5 px-5 py-14 text-center sm:px-8 lg:px-12 lg:py-20">
          <h2 className="mx-auto max-w-[560px] font-display text-[24px] font-extrabold leading-[1.15] tracking-display text-ink-100 sm:text-[30px]">
            1단계, 문의부터 시작해보세요.
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] text-[14px] leading-body text-ink-70">
            필요한 콘텐츠를 알려주시면 빠르게 상담과 견적을 진행해드립니다.
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
