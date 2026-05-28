"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { caseStudies, type PortfolioItem } from "@/lib/site-data";

type Props = {
  item: PortfolioItem | null;
  onClose: () => void;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function CaseStudyModal({ item, onClose }: Props) {
  const reduce = useReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [item, onClose]);

  const detail = item ? caseStudies[item.code] : null;

  return (
    <AnimatePresence>
      {item && detail && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-3 py-4 sm:px-6 sm:py-10"
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          role="dialog"
          aria-modal="true"
          aria-label={`${item.title} · 케이스 스터디`}
        >
          <motion.button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-ink-100/55 backdrop-blur-sm"
            initial={reduce ? false : { opacity: 0 }}
            animate={reduce ? undefined : { opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.985 }}
            animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[20px] border border-ink-15 bg-white"
          >
            <header
              className="relative flex items-start gap-3 border-b border-ink-15 px-5 py-4 sm:px-7 sm:py-5"
              style={{ background: `linear-gradient(135deg, ${item.bg}, #ffffff)` }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-md px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white"
                    style={{ background: item.fg }}
                  >
                    {item.client}
                  </span>
                  <span className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-50">
                    {item.cat}
                  </span>
                  <span className="num font-mono text-[10px] text-ink-50">
                    {item.code}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-[18px] font-extrabold leading-[1.3] tracking-[-0.4px] text-ink-100 sm:text-[20px]">
                  {item.title}
                </h3>
                <p className="mt-1 text-[12px] text-ink-50">
                  {item.sector} · Shipped {item.shipped}
                </p>
              </div>

              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-15 bg-white text-ink-70 transition-colors hover:border-ink-30 hover:text-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40"
              >
                <i className="ti ti-x text-[16px]" aria-hidden />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              <div className="grid grid-cols-3 gap-2">
                {item.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-ink-15 bg-ink-5 px-3 py-3"
                  >
                    <div className="font-display text-[9px] font-bold uppercase tracking-[0.08em] text-ink-50">
                      {m.label}
                    </div>
                    <div className="num mt-1 font-display text-[20px] font-extrabold tracking-[-0.4px] text-ink-100">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <BeforeAfterCard
                  tone="before"
                  label={detail.before.label}
                  note={detail.before.note}
                  item={item}
                />
                <BeforeAfterCard
                  tone="after"
                  label={detail.after.label}
                  note={detail.after.note}
                  item={item}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Block label="목표">{detail.goal}</Block>
                <Block label="결과">{detail.result}</Block>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SmallBlock label="제작 기간" value={detail.duration} />
                <SmallBlock
                  label="사용 채널"
                  value={detail.channels.join(" · ")}
                />
              </div>

              <div className="mt-6">
                <PanelLabel>제작 프로세스</PanelLabel>
                <ol className="mt-3 space-y-2">
                  {detail.process.map((step, i) => (
                    <li
                      key={step}
                      className="flex items-start gap-3 rounded-xl border border-ink-15 bg-white px-3.5 py-3"
                    >
                      <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-md bg-iris/10 font-display text-[10px] font-bold text-iris">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[12px] leading-[1.55] text-ink-70">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-6">
                <PanelLabel>AI Pipeline</PanelLabel>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.aiPipeline.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1.5 rounded-full border border-iris/20 bg-iris-light px-2.5 py-1 text-[11px] font-medium text-iris"
                    >
                      <i className="ti ti-cpu text-[11px]" aria-hidden />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <footer className="flex flex-col gap-3 border-t border-ink-15 bg-ink-5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-2 text-[12px] text-ink-70">
                <i className="ti ti-shield-check text-[16px] text-success" aria-hidden />
                실제 클라이언트 동의 하에 정리된 케이스입니다.
              </div>
              <a
                href={`mailto:hello@studioboda.kr?subject=${encodeURIComponent(
                  `[${item.client}] 비슷한 프로젝트 문의`,
                )}`}
                className="group inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink-100 px-5 text-[12px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.985]"
              >
                비슷한 프로젝트 문의
                <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-50">
      {children}
    </p>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-15 bg-white px-4 py-4">
      <PanelLabel>{label}</PanelLabel>
      <p className="mt-2 text-[13px] leading-[1.65] text-ink-70">{children}</p>
    </div>
  );
}

function SmallBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-15 bg-ink-5 px-4 py-3">
      <PanelLabel>{label}</PanelLabel>
      <p className="mt-1 text-[13px] font-semibold text-ink-100">{value}</p>
    </div>
  );
}

function BeforeAfterCard({
  tone,
  label,
  note,
  item,
}: {
  tone: "before" | "after";
  label: string;
  note: string;
  item: PortfolioItem;
}) {
  const isAfter = tone === "after";
  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        isAfter ? "border-iris/30" : "border-ink-15"
      }`}
    >
      <div
        className="relative flex h-[88px] items-center justify-center"
        style={{ background: isAfter ? item.bg : "#F6F6FA" }}
      >
        <span
          className="font-display text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: isAfter ? item.fg : "#7E7E8C" }}
        >
          {isAfter ? "AFTER · BODA" : "BEFORE"}
        </span>
        {isAfter && (
          <div className="absolute inset-x-3 bottom-2 flex gap-1">
            <div className="h-1 flex-1 rounded-full" style={{ background: item.fg }} />
            <div className="h-1 w-6 rounded-full" style={{ background: `${item.fg}55` }} />
          </div>
        )}
      </div>
      <div className="px-3.5 py-3">
        <p
          className={`font-display text-[12px] font-bold ${
            isAfter ? "text-iris" : "text-ink-70"
          }`}
        >
          {label}
        </p>
        <p className="mt-1 text-[11px] leading-[1.55] text-ink-50">{note}</p>
      </div>
    </div>
  );
}
