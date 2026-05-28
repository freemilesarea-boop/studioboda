"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { createBrowserAuthSupabase } from "@/lib/supabase/browser";
import type { Service, ServiceOption } from "@/lib/types/db";

type DeliveryKey = "normal" | "fast" | "easy";
const DELIVERY: { key: DeliveryKey; label: string; multiplier: number }[] = [
  { key: "normal", label: "보통 (3-5일)", multiplier: 1 },
  { key: "fast",   label: "빠른 납품 (1-2일)", multiplier: 1.3 },
  { key: "easy",   label: "여유 (7일 이상)", multiplier: 0.9 },
];

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export function QuoteCalculatorClient({
  services,
  options,
}: {
  services: Service[];
  options: ServiceOption[];
}) {
  const initialKey = services[0]?.key ?? "";
  const [serviceKey, setServiceKey] = useState<string>(initialKey);
  const [delivery, setDelivery] = useState<DeliveryKey>("normal");
  const [addonKeys, setAddonKeys] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const supabase = createBrowserAuthSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (active) setSignedIn(!!user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (active) setSignedIn(!!s?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const service = useMemo(
    () => services.find((s) => s.key === serviceKey) ?? services[0],
    [services, serviceKey],
  );
  const deliveryOption = DELIVERY.find((d) => d.key === delivery)!;

  const total = useMemo(() => {
    if (!service) return 0;
    const addonSum = addonKeys.reduce((acc, k) => {
      const o = options.find((x) => x.key === k);
      return acc + (o?.price ?? 0);
    }, 0);
    return Math.round((service.base_price + addonSum) * deliveryOption.multiplier);
  }, [service, options, addonKeys, deliveryOption]);

  const toggleAddon = (k: string) => {
    setAddonKeys((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  };

  const startInquiry = () => {
    if (!service) return;
    const addonLabels = addonKeys
      .map((k) => options.find((o) => o.key === k)?.label)
      .filter(Boolean) as string[];

    const message = [
      `선택 서비스: ${service.name}`,
      `납기: ${deliveryOption.label}`,
      addonLabels.length ? `추가 옵션: ${addonLabels.join(", ")}` : null,
      `예상 견적: ${total.toLocaleString()}원 (VAT 별도)`,
    ]
      .filter(Boolean)
      .join("\n");

    if (signedIn === false) {
      try {
        sessionStorage.setItem(
          "boda:quote-prefill",
          JSON.stringify({ service_type: service.name, message }),
        );
      } catch {
        /* sessionStorage blocked */
      }
      router.push(`/signup?plan=${encodeURIComponent(service.key)}`);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("boda:quote-prefill", {
        detail: { service_type: service.name, message },
      }),
    );

    const el = document.getElementById("inquiry");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (services.length === 0) {
    return (
      <section className="section bg-ink-5" id="quote">
        <SectionHeader
          eyebrow="Price Calculator"
          title="실시간 견적 계산기"
          subtitle="옵션을 선택하면 즉시 견적이 계산됩니다."
          align="center"
        />
        <div className="mx-auto mt-10 max-w-[720px] rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-12 text-center">
          <i className="ti ti-database-off text-[26px] text-ink-30" aria-hidden />
          <p className="mt-2 font-display text-[13px] font-bold text-ink-100">
            서비스 카탈로그를 불러오지 못했습니다
          </p>
          <p className="mt-1 text-[12px] text-ink-50">
            잠시 후 다시 시도해주세요. 문의는 hello@studioboda.kr.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section bg-ink-5" id="quote">
      <SectionHeader
        eyebrow="Price Calculator"
        title="실시간 견적 계산기"
        subtitle="옵션을 선택하면 즉시 견적이 계산됩니다."
        align="center"
      />

      <Reveal delay={0.1}>
        <div className="mx-auto mt-10 max-w-[720px] rounded-[20px] border border-ink-15 bg-white p-6 sm:p-9">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="서비스 유형">
              <SelectInput
                value={serviceKey}
                onChange={setServiceKey}
                options={services.map((s) => ({
                  value: s.key,
                  label: `${s.name} (${fmt(s.base_price)}원~)`,
                }))}
              />
            </Field>
            <Field label="납기 기간">
              <SelectInput
                value={delivery}
                onChange={(v) => setDelivery(v as DeliveryKey)}
                options={DELIVERY.map((d) => ({
                  value: d.key,
                  label:
                    d.label +
                    (d.multiplier === 1
                      ? ""
                      : d.multiplier > 1
                      ? ` (+${Math.round((d.multiplier - 1) * 100)}%)`
                      : ` (-${Math.round((1 - d.multiplier) * 100)}%)`),
                }))}
              />
            </Field>
          </div>

          {options.length > 0 ? (
            <Field label="추가 옵션" className="mt-4">
              <div className="flex flex-wrap gap-2">
                {options.map((a) => {
                  const on = addonKeys.includes(a.key);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAddon(a.key)}
                      aria-pressed={on}
                      className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-[border,background,color] duration-150 focus-ring ${
                        on
                          ? "border-iris bg-iris text-white"
                          : "border-ink-15 bg-white text-ink-70 hover:border-iris hover:text-iris"
                      }`}
                    >
                      {a.label}
                      <span
                        className={on ? "ml-1 text-white/85" : "ml-1 text-ink-50"}
                      >{`(+${fmt(a.price)}원)`}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          ) : null}

          <ResultBox total={total} onStart={startInquiry} />
        </div>
      </Reveal>
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[12px] font-semibold text-ink-70">{label}</label>
      {children}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-[9px] border border-ink-15 bg-ink-5 px-3.5 py-2.5 pr-9 text-[13px] text-ink-100 transition-colors focus:border-iris focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-50"
        aria-hidden
      >
        <i className="ti ti-chevron-down text-[14px]" />
      </span>
    </div>
  );
}

function ResultBox({ total, onStart }: { total: number; onStart: () => void }) {
  const reduce = useReducedMotion();
  return (
    <div className="mt-5 flex flex-col items-stretch gap-4 rounded-[14px] bg-ink-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div>
        <p className="text-[13px] text-ink-30">예상 견적</p>
        <p className="num mt-1 font-display text-[28px] font-extrabold leading-none tracking-display text-white sm:text-[32px]">
          <motion.span
            key={total}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block"
          >
            {total.toLocaleString()}원
          </motion.span>
          <span className="num ml-2 text-[13px] font-normal text-iris-glow">
            VAT 별도
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="group inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] bg-iris px-6 text-[13px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.985] focus-ring"
      >
        이 견적으로 시작하기
        <span className="transition-transform duration-150 group-hover:translate-x-0.5">
          →
        </span>
      </button>
    </div>
  );
}
