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
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
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
  const priceLabel = priceLabelFor(service.category);
  const visual = visualFor(service.key);

  return (
    <article
      className={`card-cinematic group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white ${
        service.featured
          ? "border-iris/30 ring-1 ring-iris/[0.04]"
          : "border-ink-15"
      }`}
    >
      <Link
        href={`/services/${service.key}`}
        className="relative block aspect-[16/10] w-full overflow-hidden"
        aria-label={`${service.name} 자세히 보기`}
      >
        <div
          className="absolute inset-0"
          style={{ background: visual.background }}
          aria-hidden
        />
        {/* Decorative pattern — soft circles for texture without distraction */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light"
          style={{
            background:
              "radial-gradient(40% 60% at 80% 30%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%), radial-gradient(35% 50% at 15% 85%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)",
          }}
          aria-hidden
        />
        <i
          className={`ti ${service.icon ?? "ti-sparkles"} absolute right-5 top-5 text-[44px] text-white/85`}
          aria-hidden
        />
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div>
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/70">
              {visual.label}
            </span>
            <p className="mt-1 font-display text-[20px] font-extrabold leading-[1.15] tracking-[-0.4px] text-white sm:text-[22px]">
              {service.name}
            </p>
          </div>
          {service.badge ? (
            <span className="shrink-0 rounded-full bg-white/95 px-2.5 py-0.5 font-display text-[10.5px] font-bold tracking-[-0.1px] text-ink-100">
              {service.badge}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <Link href={`/services/${service.key}`} className="outline-none">
          {service.name_en ? (
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-50">
              {service.name_en}
            </p>
          ) : null}
          <p className="mt-2 line-clamp-3 text-[14px] leading-[1.7] text-ink-70 sm:text-[14.5px]">
            {service.description}
          </p>
        </Link>

        <div className="mt-6 flex items-end justify-between border-t border-ink-15 pt-4">
          <div>
            <span className="block text-[11px] uppercase tracking-[0.1em] text-ink-50">
              {priceLabel}
            </span>
            <span className="num mt-1 block font-display text-[20px] font-extrabold tracking-[-0.5px] text-ink-100">
              {fmt(service.base_price)}
              <span className="ml-0.5 text-[14px] font-bold text-ink-70">원~</span>
            </span>
          </div>
          <StartCTA
            variant="cinematic"
            size="md"
            plan={service.key}
            className="!px-4"
          >
            신청하기 →
          </StartCTA>
        </div>
      </div>
    </article>
  );
}

type ServiceVisual = { background: string; label: string };

const VISUALS: Record<string, ServiceVisual> = {
  detail: {
    background:
      "linear-gradient(135deg, #6E5BFF 0%, #4DA3FF 100%)",
    label: "DETAIL PAGE",
  },
  sns: {
    background:
      "linear-gradient(135deg, #FF6B9D 0%, #F59E0B 100%)",
    label: "SNS · INSTAGRAM",
  },
  ad: {
    background:
      "linear-gradient(135deg, #F97316 0%, #DC2626 100%)",
    label: "PERFORMANCE AD",
  },
  thumb: {
    background:
      "linear-gradient(135deg, #5B47FF 0%, #312E81 100%)",
    label: "THUMBNAIL · YT",
  },
  brand: {
    background:
      "linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)",
    label: "IDENTITY",
  },
  deck: {
    background:
      "linear-gradient(135deg, #F59E0B 0%, #B45309 100%)",
    label: "COMPANY DECK",
  },
  package: {
    background:
      "linear-gradient(135deg, #A855F7 0%, #EC4899 100%)",
    label: "BRAND PACKAGE",
  },
  monthly: {
    background:
      "linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)",
    label: "MONTHLY OPS",
  },
};

function visualFor(key: string): ServiceVisual {
  return (
    VISUALS[key] ?? {
      background: "linear-gradient(135deg, #6E5BFF 0%, #A58BFF 100%)",
      label: "STUDIO BODA",
    }
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
