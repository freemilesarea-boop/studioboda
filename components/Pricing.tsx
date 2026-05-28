import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { pricing, type Pricing as PricingItem } from "@/lib/site-data";

export function Pricing() {
  return (
    <section className="section bg-white" id="pricing">
      <SectionHeader
        eyebrow="Pricing"
        title="규모가 아닌 목표로 시작하세요"
        subtitle="콘텐츠 단발 운영부터 브랜드 전체 정비까지. 상황에 맞는 플랜으로 시작하고, 필요한 만큼 확장합니다."
      />

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {pricing.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.05}>
            <PricingCard plan={p} />
          </Reveal>
        ))}
      </div>

      <p className="mt-8 text-center text-[12px] text-ink-50">
        모든 플랜의 정확한 견적은 브랜드, 카테고리, 운영 채널, 산출물 수량에 따라
        조율됩니다. VAT 별도.
      </p>
    </section>
  );
}

function PricingCard({ plan }: { plan: PricingItem }) {
  if (plan.featured) {
    return (
      <article className="flex h-full flex-col rounded-[20px] border-[1.5px] border-ink-90 bg-ink-100 p-7">
        {plan.badge && (
          <span className="mb-3.5 inline-block w-fit rounded-full bg-iris-light px-2.5 py-0.5 text-[10px] font-bold text-iris">
            {plan.badge}
          </span>
        )}
        <h3 className="font-display text-[17px] font-extrabold text-white">
          {plan.name}
        </h3>
        <p className="mt-1 text-[12px] leading-[1.5] text-ink-30">{plan.sub}</p>
        <p className="mt-5 font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.5px] text-white">
          {plan.price}
          {plan.unit && (
            <span className="text-[13px] font-normal text-ink-30">
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
                className="ti ti-check shrink-0 text-[14px] text-sky"
                aria-hidden
              />
              {it}
            </li>
          ))}
        </ul>
        <a
          href={
            plan.price === "견적 문의"
              ? "mailto:hello@studioboda.kr?subject=STUDIO%20BODA%20Brand%20Sprint%20문의"
              : "#quote"
          }
          className="group mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-iris text-[13px] font-bold text-white transition-opacity hover:opacity-90 focus-ring"
        >
          {plan.cta}
          <span className="transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </a>
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-ink-15 bg-white p-7">
      <h3 className="font-display text-[17px] font-extrabold text-ink-100">
        {plan.name}
      </h3>
      <p className="mt-1 text-[12px] leading-[1.5] text-ink-50">{plan.sub}</p>
      <p className="mt-5 font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.5px] text-ink-100">
        {plan.price}
        {plan.unit && (
          <span className="text-[13px] font-normal text-ink-50">
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
              className="ti ti-check shrink-0 text-[14px] text-iris"
              aria-hidden
            />
            {it}
          </li>
        ))}
      </ul>
      <a
        href={
          plan.price === "견적 문의"
            ? "mailto:hello@studioboda.kr?subject=STUDIO%20BODA%20Brand%20Sprint%20문의"
            : "#quote"
        }
        className="group mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-ink-15 bg-white text-[13px] font-bold text-ink-100 transition-colors hover:border-iris hover:text-iris focus-ring"
      >
        {plan.cta}
        <span className="transition-transform duration-150 group-hover:translate-x-0.5">
          →
        </span>
      </a>
    </article>
  );
}
