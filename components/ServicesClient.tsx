"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { StartCTA } from "./StartCTA";
import { PRIMARY_SERVICE_KEYS, type Service } from "@/lib/types/db";

type Tab = "all" | "content" | "ad" | "brand" | "package";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "content", label: "콘텐츠" },
  { key: "ad", label: "광고" },
  { key: "brand", label: "브랜드" },
  { key: "package", label: "패키지" },
];

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

const tabFor = (category: string): Tab => {
  if (category === "subscription") return "package";
  if (category === "package") return "package";
  if (category === "ad") return "ad";
  if (category === "brand") return "brand";
  return "content";
};

const priceLabelFor = (category: string) =>
  category === "subscription" ? "월" : "시작가";

export function ServicesClient({ services }: { services: Service[] }) {
  const [active, setActive] = useState<Tab>("all");

  const ordered = useMemo(() => {
    // Always show PDF-primary 5 first, then others by sort_order
    const isPrimary = (s: Service) =>
      (PRIMARY_SERVICE_KEYS as readonly string[]).includes(s.key);
    return [...services].sort((a, b) => {
      const pa = isPrimary(a) ? 0 : 1;
      const pb = isPrimary(b) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.sort_order - b.sort_order;
    });
  }, [services]);

  const filtered = useMemo(() => {
    if (active === "all") return ordered;
    return ordered.filter((s) => tabFor(s.category) === active);
  }, [ordered, active]);

  return (
    <section className="section bg-white" id="services">
      <SectionHeader
        eyebrow="Services"
        title="어떤 콘텐츠가 필요하신가요?"
        subtitle="목적에 맞는 서비스를 선택하면 AI가 최적의 제작 플로우를 안내합니다."
        action={
          <Link
            href="/services"
            className="text-[13px] font-semibold text-iris transition-opacity hover:opacity-80"
          >
            전체 카탈로그 →
          </Link>
        }
      />

      <Reveal delay={0.12}>
        <div className="mt-9 -mx-2 flex flex-nowrap gap-1.5 overflow-x-auto border-b border-ink-15 px-2 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = tab.key === active;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                aria-pressed={isActive}
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

      {filtered.length === 0 ? (
        <EmptyServices />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.04}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const featured = service.featured;
  const priceLabel = priceLabelFor(service.category);

  if (featured) {
    return (
      <article className="card-cinematic group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-noir-1 p-6">
        <div className="flex items-start justify-between">
          <Link
            href={`/services/${service.key}`}
            className="grid h-10 w-10 place-items-center rounded-[10px] bg-iris/20 text-[20px] text-iris-glow"
          >
            <i className={`ti ${service.icon ?? "ti-sparkles"}`} aria-hidden />
          </Link>
          {service.badge && (
            <span className="rounded-full bg-iris px-2.5 py-0.5 text-[10px] font-bold text-white">
              {service.badge}
            </span>
          )}
        </div>

        <Link
          href={`/services/${service.key}`}
          className="mt-8 flex-1 outline-none"
        >
          <h3 className="font-display text-[16px] font-bold text-white">
            {service.name}
            {service.name_en ? (
              <span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-caption text-ink-30">
                {service.name_en}
              </span>
            ) : null}
          </h3>
          <p className="mt-1.5 line-clamp-3 text-[12px] leading-body text-ink-30">
            {service.description}
          </p>
        </Link>

        <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
          <div>
            <span className="block text-[11px] text-ink-30">{priceLabel}</span>
            <span className="num font-display text-[16px] font-bold text-white">
              {fmt(service.base_price)}원~
            </span>
          </div>
          <StartCTA
            variant="ghost-light"
            size="sm"
            plan={service.key}
            className="!bg-transparent !border-0 !text-iris-glow"
          >
            신청하기 →
          </StartCTA>
        </div>

        <div className="pointer-events-none absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-iris/20 blur-3xl" />
      </article>
    );
  }

  return (
    <article className="card-cinematic group relative flex h-full flex-col rounded-2xl border border-ink-15 bg-white p-6">
      <Link
        href={`/services/${service.key}`}
        className="grid h-10 w-10 place-items-center rounded-[10px] bg-iris-light text-[20px] text-iris"
      >
        <i className={`ti ${service.icon ?? "ti-sparkles"}`} aria-hidden />
      </Link>

      <Link
        href={`/services/${service.key}`}
        className="mt-8 flex-1 outline-none"
      >
        <h3 className="font-display text-[16px] font-bold text-ink-100">
          {service.name}
          {service.name_en ? (
            <span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-caption text-ink-50">
              {service.name_en}
            </span>
          ) : null}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-[12px] leading-body text-ink-70">
          {service.description}
        </p>
      </Link>

      <div className="mt-6 flex items-center justify-between border-t border-ink-15 pt-4">
        <div>
          <span className="block text-[11px] text-ink-50">{priceLabel}</span>
          <span className="num font-display text-[16px] font-bold text-ink-100">
            {fmt(service.base_price)}원~
          </span>
        </div>
        <StartCTA
          variant="ghost-dark"
          size="sm"
          plan={service.key}
          className="!bg-transparent !text-iris"
        >
          신청하기 →
        </StartCTA>
      </div>
    </article>
  );
}

function EmptyServices() {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-ink-15 bg-ink-5 px-5 py-12 text-center">
      <i className="ti ti-database-off text-[26px] text-ink-30" aria-hidden />
      <p className="mt-2 font-display text-[13px] font-bold text-ink-100">
        서비스 카탈로그를 불러오지 못했습니다
      </p>
      <p className="mt-1 text-[12px] text-ink-50">
        잠시 후 다시 시도해주세요. 문의는 hello@studioboda.kr.
      </p>
    </div>
  );
}
