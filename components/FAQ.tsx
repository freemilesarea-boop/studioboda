"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { faqs } from "@/lib/site-data";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section className="section bg-ink-05" id="faq">
      <div className="container">
        <SectionHeader
          eyebrow="FAQ · COMMON QUESTIONS"
          title={
            <>
              자주 묻는
              <br />
              질문들.
            </>
          }
          desc="문의 전 가장 많이 받는 질문들을 정리했습니다. 더 궁금한 점은 언제든 메일로 문의해 주세요."
        />

        <div className="mx-auto mt-14 max-w-3xl divide-y divide-ink-15 overflow-hidden rounded-3xl border border-ink-15 bg-white">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-ink-05 sm:px-7 sm:py-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="meta mt-1.5 w-8 shrink-0">{`Q.${String(
                      i + 1,
                    ).padStart(2, "0")}`}</span>
                    <span className="text-base font-medium text-ink-100 sm:text-[17px]">
                      {f.q}
                    </span>
                  </div>
                  <span
                    className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink-15 bg-white text-ink-100 transition-transform duration-300 ${
                      isOpen ? "rotate-45 border-iris/30 text-iris" : ""
                    }`}
                    aria-hidden
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <path
                        d="M5 1v8M1 5h8"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={reduce ? undefined : { height: 0, opacity: 0 }}
                      animate={reduce ? undefined : { height: "auto", opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-4 px-6 pb-6 sm:px-7">
                        <span className="meta mt-1 w-8 shrink-0 text-iris">{`A.${String(
                          i + 1,
                        ).padStart(2, "0")}`}</span>
                        <p className="max-w-2xl text-[15px] leading-[1.75] text-ink-70">
                          {f.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
