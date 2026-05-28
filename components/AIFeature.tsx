"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { Reveal, Stagger, StaggerItem } from "./ui/Reveal";
import { aiFeatures } from "@/lib/site-data";

const STAGES = ["분석", "초안", "검수", "완성"] as const;

export function AIFeature() {
  return (
    <section className="section bg-white" id="ai">
      <SectionHeader
        eyebrow="AI Engine"
        title="브랜드를 학습하는 AI"
        subtitle="범용 AI가 아닙니다. 브랜드 보이스 · 전환 데이터 · SEO 가이드를 함께 학습한 BODA 전용 모델이 초안을 만듭니다."
      />

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <Stagger className="flex flex-col gap-3" stagger={0.06}>
          {aiFeatures.map((f) => (
            <StaggerItem key={f.title}>
              <AIFeatureItem feature={f} />
            </StaggerItem>
          ))}
          <StaggerItem>
            <div className="mt-2 rounded-[14px] border border-ink-15 bg-ink-5 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">Trained on</p>
                  <p className="mt-2 font-display text-[13px] font-bold text-ink-100">
                    320+ 브랜드 · 2,400+ 캠페인 데이터
                  </p>
                </div>
                <p className="num font-display text-[20px] font-extrabold tracking-[-0.4px] text-iris">
                  v4.2
                </p>
              </div>
            </div>
          </StaggerItem>
        </Stagger>

        <Reveal delay={0.1}>
          <AIChatDemo />
        </Reveal>
      </div>
    </section>
  );
}

function AIFeatureItem({ feature }: { feature: (typeof aiFeatures)[number] }) {
  return (
    <div className="group flex cursor-pointer items-start gap-3.5 rounded-[14px] border border-ink-15 bg-white p-4.5 transition-[border,background] duration-200 hover:border-iris hover:bg-ink-5">
      <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[9px] bg-iris-light text-[19px] text-iris">
        <i className={`ti ${feature.icon}`} aria-hidden />
      </div>
      <div>
        <h4 className="font-display text-[13px] font-bold text-ink-100">
          {feature.title}
        </h4>
        <p className="mt-1 text-[12px] leading-[1.55] text-ink-50">
          {feature.desc}
        </p>
      </div>
    </div>
  );
}

function AIChatDemo() {
  const [progress, setProgress] = useState(28);
  const [stage, setStage] = useState(1);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 1.2;
        if (next > 96) return 28;
        return next;
      });
    }, 90);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress < 40) setStage(1);
    else if (progress < 70) setStage(2);
    else if (progress < 92) setStage(3);
    else setStage(4);
  }, [progress]);

  useEffect(() => {
    const id = setInterval(() => setTyping((t) => !t), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-[20px] border border-ink-90 bg-ink-100 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28CA41]" />
        <span className="ml-auto text-[11px] text-ink-50">
          BODA AI · 상세페이지 세션
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {STAGES.map((s, i) => {
          const idx = i + 1;
          const reached = stage >= idx;
          const active = stage === idx;
          return (
            <div
              key={s}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-300 ${
                active
                  ? "bg-iris text-white"
                  : reached
                  ? "bg-iris/20 text-sky"
                  : "bg-ink-90 text-ink-50"
              }`}
            >
              <span className="num font-mono text-[9px] opacity-70">
                {String(idx).padStart(2, "0")}
              </span>
              {s}
              {idx < STAGES.length && (
                <span className="ml-1 text-ink-50/40" aria-hidden>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        <ChatBubble tone="ai">
          안녕하세요. 상세페이지 제작을 시작할게요. <br />
          어떤 카테고리의 상품인가요?
        </ChatBubble>
        <ChatBubble tone="user">비건 스킨케어 세럼이에요.</ChatBubble>
        <ChatBubble tone="ai">
          좋아요. 타겟은 20~30대 여성, USP는 비건 · 저자극으로 잡고 후킹 카피
          5가지를 먼저 제안드릴게요.
        </ChatBubble>

        {typing && (
          <div className="inline-flex w-fit items-center gap-2 rounded-[12px_12px_12px_4px] bg-ink-90 px-3.5 py-2.5">
            <span className="text-[11px] text-ink-50">BODA AI</span>
            <span className="flex items-center gap-1">
              <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-ink-30" />
              <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-ink-30" />
              <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-ink-30" />
            </span>
          </div>
        )}

        <div className="rounded-xl border border-ink-90 bg-ink-90/40 p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-sky">
              AI 초안 생성 · {STAGES[stage - 1]} 단계
            </p>
            <span className="num font-mono text-[10px] text-ink-50">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="space-y-1">
            <div className="skeleton-line h-2 w-[94%] rounded" />
            <div className="skeleton-line h-2 w-[78%] rounded" />
            <div className="skeleton-line h-2 w-[62%] rounded" />
          </div>
          <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-iris transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-ink-90 bg-ink-90/60 p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30">
              GENERATED · HEADLINE 03 / 05
            </p>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-bold text-success">
              SELECTED
            </span>
          </div>
          <p className="font-display text-[14px] font-bold leading-[1.4] text-white">
            “자극 없이, 발색 그대로 — 비건 세럼이 바꾸는 새벽 루틴.”
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ink-30">
              tone · 진정성
            </span>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ink-30">
              hook · 루틴
            </span>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ink-30">
              len · 28자
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-ink-90 bg-ink-90/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-sky/20 text-sky">
              <i className="ti ti-user-check text-[12px]" aria-hidden />
            </span>
            <span className="text-[12px] text-ink-30">
              디렉터 검수 단계로 자동 인계됩니다
            </span>
          </div>
          <span className="text-[10px] font-semibold text-ink-50">
            NEXT · CURATION
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "ai" | "user";
}) {
  if (tone === "user") {
    return (
      <div className="ml-auto max-w-[86%] rounded-[12px_12px_4px_12px] bg-iris px-3.5 py-3 text-[12px] leading-[1.65] text-white">
        {children}
      </div>
    );
  }
  return (
    <div className="max-w-[86%] rounded-[12px_12px_12px_4px] bg-ink-90 px-3.5 py-3 text-[12px] leading-[1.65] text-ink-30">
      {children}
    </div>
  );
}
