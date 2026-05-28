"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { faqs } from "@/lib/site-data";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section className="section bg-ink-5" id="faq">
      <SectionHeader
        eyebrow="FAQ"
        title="자주 묻는 질문"
        subtitle="문의 전 가장 많이 받는 질문들을 정리했습니다. 더 궁금한 점은 메일로 편하게 문의해 주세요."
      />

      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-ink-15 bg-white px-2 sm:px-4">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          const isLast = i === faqs.length - 1;
          return (
            <div
              key={f.q}
              className={isLast ? "" : "border-b border-ink-15"}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className={`flex w-full items-center justify-between gap-6 px-4 py-5 text-left transition-colors focus-ring sm:px-5 ${
                  isOpen ? "text-iris" : "text-ink-100"
                }`}
              >
                <span className="font-display text-[14px] font-semibold sm:text-[15px]">
                  {f.q}
                </span>
                <i
                  className={`ti ti-chevron-down shrink-0 text-[18px] transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-iris" : "text-ink-50"
                  }`}
                  aria-hidden
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={reduce ? undefined : { height: 0, opacity: 0 }}
                    animate={reduce ? undefined : { height: "auto", opacity: 1 }}
                    exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl px-4 pb-5 text-[13px] leading-[1.75] text-ink-50 sm:px-5">
                      {f.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
