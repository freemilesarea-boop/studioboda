import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { pricing, enterprise, type Pricing as PricingItem } from "@/lib/site-data";

export function Pricing() {
  return (
    <section className="section bg-white" id="pricing">
      <SectionHeader
        eyebrow="Pricing"
        title="규모가 아닌 목표로 시작하세요"
        subtitle="콘텐츠 단발 운영부터 브랜드 전체 정비까지. 상황에 맞는 플랜으로 시작하고 필요한 만큼 확장합니다."
      />

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {pricing.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.05}>
            <PricingCard plan={p} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.18}>
        <article className="mt-4 grid grid-cols-1 gap-6 overflow-hidden rounded-[20px] border border-ink-15 bg-ink-5 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-eyebrow text-white">
                Enterprise
              </span>
              <span className="num font-mono text-[10px] text-ink-50">
                PRIORITY QUEUE
              </span>
            </div>
            <h3 className="mt-3 font-display text-[22px] font-extrabold leading-[1.2] tracking-[-0.4px] text-ink-100 sm:text-[26px]">
              {enterprise.title}
            </h3>
            <p className="mt-2 max-w-xl text-[13px] leading-[1.65] text-ink-70">
              {enterprise.sub}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {enterprise.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-[12px] leading-[1.55] text-ink-70"
                >
                  <i
                    className="ti ti-check mt-0.5 shrink-0 text-[14px] text-iris"
                    aria-hidden
                  />
                  {b}
                </li>
              ))}
            </ul>
            <a
              href="mailto:hello@studioboda.kr?subject=STUDIO%20BODA%20Enterprise%20문의"
              className="group inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-ink-100 px-6 text-[13px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              {enterprise.cta}
              <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </div>
        </article>
      </Reveal>

      <p className="mt-8 text-center text-[12px] text-ink-50">
        모든 플랜의 정확한 견적은 브랜드 · 카테고리 · 운영 채널 · 산출물 수량에
        따라 조율됩니다. VAT 별도.
      </p>
    </section>
  );
}

function PricingCard({ plan }: { plan: PricingItem }) {
  const isQuote = plan.price === "견적 문의";

  if (plan.featured) {
    return (
      <article className="relative flex h-full flex-col overflow-hidden rounded-[20px] border-[1.5px] border-ink-90 bg-ink-100 p-7">
        <div className="flex items-center justify-between">
          {plan.badge && (
            <span className="inline-block rounded-full bg-iris-light px-2.5 py-0.5 text-[10px] font-bold text-iris">
              {plan.badge}
            </span>
          )}
          <span className="num font-mono text-[10px] text-ink-50">PKG·02</span>
        </div>
        <h3 className="mt-3 font-display text-[18px] font-extrabold text-white">
          {plan.name}
        </h3>
        <p className="mt-1 text-[12px] leading-[1.5] text-ink-30">{plan.sub}</p>
        <p className="mt-5 num font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.8px] text-white">
          ₩{plan.price}
          {plan.unit && (
            <span className="num ml-0.5 text-[13px] font-normal text-ink-30">
              {plan.unit}
            </span>
          )}
        </p>
        <hr className="my-5 border-white/[0.08]" />
        <ul className="space-y-1.5">
          {plan.items.map((it) => (
            <li
              key={it}
              className="flex items-start gap-2 py-1 text-[12px] leading-[1.6] text-ink-30"
            >
              <i
                className="ti ti-check mt-0.5 shrink-0 text-[14px] text-sky"
                aria-hidden
              />
              {it}
            </li>
          ))}
        </ul>
        <a
          href="#quote"
          className="group mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-iris text-[13px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          {plan.cta}
          <span className="transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </a>
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-iris-grad opacity-25 blur-3xl" />
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-ink-15 bg-white p-7 transition-[border-color] duration-200 hover:border-ink-30">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-ink-5 px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-70">
          {plan.name === "Starter" ? "BASIC" : "PROJECT"}
        </span>
        <span className="num font-mono text-[10px] text-ink-50">
          PKG·{plan.name === "Starter" ? "01" : "03"}
        </span>
      </div>
      <h3 className="mt-3 font-display text-[18px] font-extrabold text-ink-100">
        {plan.name}
      </h3>
      <p className="mt-1 text-[12px] leading-[1.5] text-ink-50">{plan.sub}</p>
      <p className="num mt-5 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.8px] text-ink-100">
        {isQuote ? plan.price : `₩${plan.price}`}
        {plan.unit && (
          <span className="num ml-0.5 text-[13px] font-normal text-ink-50">
            {plan.unit}
          </span>
        )}
      </p>
      <hr className="my-5 border-ink-15" />
      <ul className="space-y-1.5">
        {plan.items.map((it) => (
          <li
            key={it}
            className="flex items-start gap-2 py-1 text-[12px] leading-[1.6] text-ink-70"
          >
            <i
              className="ti ti-check mt-0.5 shrink-0 text-[14px] text-iris"
              aria-hidden
            />
            {it}
          </li>
        ))}
      </ul>
      <a
        href={
          isQuote
            ? "mailto:hello@studioboda.kr?subject=STUDIO%20BODA%20Brand%20Sprint%20문의"
            : "#quote"
        }
        className="group mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-ink-15 bg-white text-[13px] font-bold text-ink-100 transition-colors hover:border-iris hover:text-iris active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {plan.cta}
        <span className="transition-transform duration-150 group-hover:translate-x-0.5">
          →
        </span>
      </a>
    </article>
  );
}
