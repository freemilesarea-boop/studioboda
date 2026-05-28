"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { services, serviceTabs, type Service } from "@/lib/site-data";

export function Services() {
  const [active, setActive] = useState<(typeof serviceTabs)[number]["key"]>("all");

  const filtered = useMemo(() => {
    if (active === "all") return services;
    return services.filter((s) => s.key === active);
  }, [active]);

  return (
    <section className="section bg-white" id="services">
      <SectionHeader
        eyebrow="Services"
        title="어떤 콘텐츠가 필요하신가요?"
        subtitle="목적에 맞는 서비스를 선택하면 AI가 최적의 제작 플로우를 안내합니다. 단일 건부터 패키지까지 자유롭게 조합 가능합니다."
      />

      <Reveal delay={0.15}>
        <div className="mt-9 -mx-2 flex flex-nowrap gap-1.5 overflow-x-auto border-b border-ink-15 px-2 scrollbar-none">
          {serviceTabs.map((tab) => {
            const isActive = tab.key === active;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                className={`-mb-px shrink-0 border-b-2 px-5 py-2.5 text-[13px] font-semibold transition-colors focus-ring ${
                  isActive
                    ? "border-iris text-iris"
                    : "border-transparent text-ink-50 hover:text-ink-70"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </Reveal>

      <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s, i) => (
          <Reveal key={s.key} delay={i * 0.04}>
            <ServiceCard service={s} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const featured = !!service.featured;

  if (featured) {
    return (
      <article className="group relative cursor-pointer rounded-2xl border border-ink-90 bg-ink-100 p-6 transition-transform duration-150 hover:-translate-y-0.5">
        {service.badge && (
          <span className="absolute right-4 top-4 rounded-full bg-iris px-2.5 py-0.5 text-[10px] font-bold text-white">
            {service.badge}
          </span>
        )}
        <div className="mb-4 grid h-10 w-10 place-items-center rounded-[10px] bg-iris/20 text-[20px] text-sky">
          <i className={`ti ${service.icon}`} aria-hidden />
        </div>
        <h3 className="font-display text-[15px] font-bold text-white">
          {service.name}
        </h3>
        <p className="mt-1.5 text-[12px] leading-[1.65] text-ink-30">
          {service.desc}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {service.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/[0.10] bg-white/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-ink-30"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-4">
          <div>
            <span className="block text-[11px] text-ink-30">시작가</span>
            <span className="text-[16px] font-bold text-white">
              {service.price}
            </span>
          </div>
          <a
            href="#quote"
            className="text-[12px] font-semibold text-sky transition-opacity group-hover:opacity-80"
          >
            신청하기 →
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative cursor-pointer rounded-2xl border border-ink-15 bg-ink-5 p-6 transition-[background,border,transform] duration-150 hover:-translate-y-0.5 hover:border-iris hover:bg-white">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-[10px] bg-iris-light text-[20px] text-iris">
        <i className={`ti ${service.icon}`} aria-hidden />
      </div>
      <h3 className="font-display text-[15px] font-bold text-ink-100">
        {service.name}
      </h3>
      <p className="mt-1.5 text-[12px] leading-[1.65] text-ink-50">
        {service.desc}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {service.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-ink-15 bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink-70"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-ink-15 pt-4">
        <div>
          <span className="block text-[11px] text-ink-50">시작가</span>
          <span className="text-[16px] font-bold text-ink-100">
            {service.price}
          </span>
        </div>
        <a
          href="#quote"
          className="text-[12px] font-semibold text-iris transition-opacity group-hover:opacity-80"
        >
          신청하기 →
        </a>
      </div>
    </article>
  );
}
