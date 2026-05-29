import { ArrowGlyph, LinkButton } from "./ui/Button";
import { StartCTA } from "./StartCTA";

// Pure CSS hero — no framer-motion. Animations are declared as
// .hero-fade utilities below so the entire section renders as a server
// component without shipping a client bundle.

type DeliverablePreview = {
  category: string;
  title: string;
  spec: string;
  eta: string;
  icon: string;
  thumbs: number;
};

const DELIVERABLES: DeliverablePreview[] = [
  {
    category: "상세페이지",
    title: "신제품 런칭 상세페이지",
    spec: "데스크탑 + 모바일 · 12블럭",
    eta: "1차 초안 · 24h",
    icon: "ti-layout-rows",
    thumbs: 4,
  },
  {
    category: "광고 배너",
    title: "퍼포먼스 광고 배너 3종",
    spec: "Meta · Naver · Kakao 사이즈",
    eta: "1차 초안 · 36h",
    icon: "ti-photo",
    thumbs: 3,
  },
  {
    category: "SNS 콘텐츠",
    title: "인스타그램 카드뉴스 8컷",
    spec: "1080 × 1080 · 시리즈 톤",
    eta: "1차 초안 · 48h",
    icon: "ti-square-rounded-letter-c",
    thumbs: 8,
  },
];

const HERO_HIGHLIGHTS = [
  { num: "24h", label: "1차 초안 전달" },
  { num: "5종", label: "제작 서비스" },
  { num: "1:1", label: "디렉터 검수" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white px-5 pb-16 pt-24 sm:px-8 sm:pt-28 sm:pb-20 lg:px-12 lg:pt-32 lg:pb-24">
      {/* Very soft iris tint — 5-8% only, no dark mesh */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(70% 60% at 15% 0%, rgba(110,91,255,0.07) 0%, rgba(110,91,255,0) 65%), radial-gradient(60% 50% at 100% 10%, rgba(77,163,255,0.05) 0%, rgba(77,163,255,0) 70%)",
        }}
      />

      <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7 lg:pt-2">
          <div className="hero-fade inline-flex items-center gap-2 rounded-full border border-iris/20 bg-iris/[0.06] px-3 py-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-iris" />
            <span className="text-[12px] font-semibold text-iris">
              AI 기반 콘텐츠 제작 스튜디오
            </span>
          </div>

          <h1
            className="hero-fade mt-6 max-w-[640px] font-display text-[32px] font-extrabold leading-[1.18] tracking-[-1px] text-ink-100 sm:text-[40px] lg:text-[48px] xl:text-[52px]"
            style={{ animationDelay: "60ms" }}
          >
            상세페이지부터 광고 콘텐츠까지,
            <br />
            <span className="text-iris">AI와 디렉터</span>가 빠르게 제작합니다.
          </h1>

          <p
            className="hero-fade mt-5 max-w-[560px] text-[15px] leading-[1.7] text-ink-70 sm:text-[16px] sm:leading-[1.75] lg:text-[17px]"
            style={{ animationDelay: "120ms" }}
          >
            상품 정보와 레퍼런스만 보내주세요. STUDIO BODA가 상세페이지 · SNS 콘텐츠 · 광고 배너 · 썸네일을 브랜드 톤에 맞춰 제작합니다.
          </p>

          <div
            className="hero-fade mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "180ms" }}
          >
            <StartCTA size="lg" variant="cinematic">
              프로젝트 문의하기 <ArrowGlyph />
            </StartCTA>
            <LinkButton href="#services" size="lg" variant="outline">
              서비스 보기
            </LinkButton>
            <span className="ml-1 hidden text-[13px] text-ink-50 sm:inline">
              평균 24시간 내 1차 초안 전달
            </span>
          </div>
          <p className="mt-3 text-[13px] text-ink-50 sm:hidden">
            평균 24시간 내 1차 초안 전달
          </p>

          <dl
            className="hero-fade mt-9 grid grid-cols-3 gap-x-4 border-t border-ink-15 pt-6 sm:max-w-[480px]"
            style={{ animationDelay: "280ms" }}
          >
            {HERO_HIGHLIGHTS.map((h) => (
              <div key={h.label}>
                <dt className="num font-display text-[20px] font-extrabold tracking-[-0.5px] text-ink-100 sm:text-[22px]">
                  {h.num}
                </dt>
                <dd className="mt-1 text-[12px] leading-[1.4] text-ink-50">
                  {h.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <div
            className="hero-fade flex flex-col gap-3"
            style={{ animationDelay: "220ms" }}
          >
            <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-ink-50">
              지금 만들고 있는 것
            </p>
            {DELIVERABLES.map((d, i) => (
              <DeliverableCard key={d.title} item={d} accent={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DeliverableCard({
  item,
  accent,
}: {
  item: DeliverablePreview;
  accent?: boolean;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-ink-15 bg-white p-4 shadow-[0_2px_6px_-3px_rgba(20,20,40,0.06)] transition-colors duration-200 hover:border-ink-30 sm:p-5">
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
          accent ? "bg-iris text-white" : "bg-ink-5 text-ink-70"
        }`}
        aria-hidden
      >
        <i className={`ti ${item.icon} text-[22px]`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-50">
          {item.category}
        </p>
        <p className="mt-0.5 truncate font-display text-[14px] font-bold text-ink-100 sm:text-[15px]">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-ink-50">
          {item.spec}
        </p>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-1.5 text-right sm:flex">
        <ThumbStrip count={item.thumbs} />
        <span className="text-[11px] font-semibold text-iris">{item.eta}</span>
      </div>
    </article>
  );
}

function ThumbStrip({ count }: { count: number }) {
  const cap = Math.min(count, 4);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: cap }).map((_, i) => (
        <span
          key={i}
          className="h-6 w-6 rounded-md border border-ink-15 bg-ink-5"
        />
      ))}
      {count > cap ? (
        <span className="ml-0.5 text-[10px] font-mono text-ink-50">
          +{count - cap}
        </span>
      ) : null}
    </div>
  );
}
