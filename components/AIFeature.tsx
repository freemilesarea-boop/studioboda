"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { aiFeatures } from "@/lib/site-data";

export function AIFeature() {
  return (
    <section className="section bg-white" id="ai">
      <SectionHeader
        eyebrow="AI Engine"
        title="브랜드를 학습하는 AI"
        subtitle="범용 AI가 아닙니다. 브랜드 보이스·전환 데이터·SEO 가이드를 함께 학습한 BODA 전용 모델이 초안을 만듭니다."
      />

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          {aiFeatures.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <AIFeatureItem feature={f} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <AIChatDemo />
        </Reveal>
      </div>
    </section>
  );
}

function AIFeatureItem({ feature }: { feature: (typeof aiFeatures)[number] }) {
  return (
    <div className="group flex cursor-pointer items-start gap-3.5 rounded-[14px] border border-ink-15 bg-white p-4.5 transition-[border,background] duration-150 hover:border-iris hover:bg-ink-5">
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
  const [progress, setProgress] = useState(38);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 1;
        return next > 92 ? 38 : next;
      });
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-[20px] border border-ink-90 bg-ink-100 p-6">
      <div className="mb-5 flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28CA41]" />
        <span className="ml-auto text-[11px] text-ink-50">
          BODA AI · 상세페이지 생성 중
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <ChatBubble tone="ai">
          안녕하세요! 상세페이지 제작을 시작할게요. <br />
          어떤 카테고리의 상품인가요?
        </ChatBubble>
        <ChatBubble tone="user">비건 스킨케어 세럼이에요.</ChatBubble>
        <ChatBubble tone="ai">
          좋아요. 타겟은 20~30대 여성, USP는 비건·저자극으로 잡고 후킹 카피
          5가지를 먼저 제안드릴게요.
        </ChatBubble>

        <div className="rounded-xl border border-ink-90 bg-ink-90/40 p-3.5">
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-eyebrow text-sky">
            AI 초안 생성 중 · {progress}%
          </p>
          <div className="space-y-1">
            <div className="skeleton-line h-2 w-[92%] rounded" />
            <div className="skeleton-line h-2 w-[78%] rounded" />
            <div className="skeleton-line h-2 w-[60%] rounded" />
          </div>
          <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-iris transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
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
