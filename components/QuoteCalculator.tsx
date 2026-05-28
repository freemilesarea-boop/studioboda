"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { quoteOptions } from "@/lib/site-data";

type ServiceKey = (typeof quoteOptions.service)[number]["key"];
type DeliveryKey = (typeof quoteOptions.delivery)[number]["key"];
type AddonKey = (typeof quoteOptions.addons)[number]["key"];

export function QuoteCalculator() {
  const [service, setService] = useState<ServiceKey>("detail");
  const [delivery, setDelivery] = useState<DeliveryKey>("normal");
  const [addons, setAddons] = useState<AddonKey[]>(["multi"]);

  const total = useMemo(() => {
    const s = quoteOptions.service.find((x) => x.key === service);
    const d = quoteOptions.delivery.find((x) => x.key === delivery);
    if (!s || !d) return 0;
    const addonSum = addons.reduce((acc, k) => {
      const a = quoteOptions.addons.find((x) => x.key === k);
      return acc + (a?.price ?? 0);
    }, 0);
    return Math.round((s.base + addonSum) * d.multiplier);
  }, [service, delivery, addons]);

  const toggleAddon = (k: AddonKey) => {
    setAddons((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  };

  return (
    <section className="section bg-ink-5" id="quote">
      <SectionHeader
        eyebrow="Quote"
        title="실시간 견적 계산기"
        subtitle="원하는 서비스와 옵션을 선택하면 예상 견적을 즉시 확인할 수 있습니다. 정확한 견적은 1:1 상담을 통해 확정됩니다."
      />

      <Reveal delay={0.1}>
        <div className="mx-auto mt-10 max-w-[720px] rounded-[20px] border border-ink-15 bg-white p-6 sm:p-9">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="서비스 유형">
              <SelectInput
                value={service}
                onChange={(v) => setService(v as ServiceKey)}
                options={quoteOptions.service.map((s) => ({
                  value: s.key,
                  label: `${s.label} (${s.base.toLocaleString()}원~)`,
                }))}
              />
            </Field>

            <Field label="납기 기간">
              <SelectInput
                value={delivery}
                onChange={(v) => setDelivery(v as DeliveryKey)}
                options={quoteOptions.delivery.map((d) => ({
                  value: d.key,
                  label: d.label + (d.multiplier === 1
                    ? ""
                    : d.multiplier > 1
                    ? ` (+${Math.round((d.multiplier - 1) * 100)}%)`
                    : ` (-${Math.round((1 - d.multiplier) * 100)}%)`),
                }))}
              />
            </Field>
          </div>

          <Field label="추가 옵션" className="mt-4">
            <div className="flex flex-wrap gap-2">
              {quoteOptions.addons.map((a) => {
                const on = addons.includes(a.key);
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleAddon(a.key)}
                    aria-pressed={on}
                    className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-[border,background,color] duration-150 focus-ring ${
                      on
                        ? "border-iris bg-iris text-white"
                        : "border-ink-15 bg-white text-ink-70 hover:border-iris hover:text-iris"
                    }`}
                  >
                    {a.label}{" "}
                    <span
                      className={on ? "text-white/85" : "text-ink-50"}
                    >{`(+${a.price.toLocaleString()}원)`}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <ResultBox total={total} />
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

function ResultBox({ total }: { total: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="mt-5 flex flex-col items-stretch gap-4 rounded-[14px] bg-ink-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div>
        <p className="text-[13px] text-ink-50">예상 견적</p>
        <p className="mt-1 font-display text-[28px] font-extrabold leading-none tracking-[-0.5px] text-white sm:text-[30px]">
          <motion.span
            key={total}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block"
          >
            {total.toLocaleString()}원
          </motion.span>
          <span className="ml-2 text-[13px] font-normal text-sky">
            VAT 별도
          </span>
        </p>
      </div>
      <a
        href={`mailto:hello@studioboda.kr?subject=STUDIO%20BODA%20견적%20문의&body=${encodeURIComponent(
          `예상 견적 ${total.toLocaleString()}원 기준으로 문의드립니다.`,
        )}`}
        className="group inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] bg-iris px-6 text-[13px] font-bold text-white transition-opacity hover:opacity-90 focus-ring"
      >
        이 견적으로 시작하기
        <span className="transition-transform duration-150 group-hover:translate-x-0.5">
          →
        </span>
      </a>
    </div>
  );
}
