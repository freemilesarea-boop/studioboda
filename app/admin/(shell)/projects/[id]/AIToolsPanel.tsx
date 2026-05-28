"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateBriefAction,
  generateCopyAction,
  generateDesignPromptAction,
} from "@/lib/actions/ai";
import { useToast } from "@/components/admin/Toast";

type Tab = "brief" | "copy" | "design";
type CopyKind = "copy" | "headline" | "cta" | "description";

const COPY_KINDS: { key: CopyKind; label: string }[] = [
  { key: "copy", label: "광고 카피" },
  { key: "headline", label: "헤드라인" },
  { key: "cta", label: "CTA" },
  { key: "description", label: "상품 설명" },
];

export function AIToolsPanel({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<Tab>("brief");
  const [output, setOutput] = useState("");
  const [meta, setMeta] = useState<{ provider?: string; model?: string }>({});
  const [hint, setHint] = useState("");
  const [copyKind, setCopyKind] = useState<CopyKind>("copy");
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function run() {
    startTransition(async () => {
      let r:
        | Awaited<ReturnType<typeof generateBriefAction>>
        | Awaited<ReturnType<typeof generateCopyAction>>
        | Awaited<ReturnType<typeof generateDesignPromptAction>>;
      if (tab === "brief") {
        r = await generateBriefAction(projectId);
      } else if (tab === "copy") {
        r = await generateCopyAction(projectId, copyKind, hint || undefined);
      } else {
        r = await generateDesignPromptAction(projectId, hint || undefined);
      }
      if (r.ok) {
        setOutput(r.text);
        setMeta({ provider: r.provider, model: r.model });
        push("AI 결과가 생성되었습니다");
        router.refresh();
      } else {
        push(r.error ?? "생성 실패", "error");
      }
    });
  }

  async function copyToClipboard() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      push("클립보드에 복사되었습니다");
    } catch {
      push("복사 실패", "error");
    }
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "brief", label: "AI 브리프", icon: "ti-file-text" },
    { key: "copy", label: "카피 생성", icon: "ti-typography" },
    { key: "design", label: "디자인 프롬프트", icon: "ti-sparkles" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-display text-[12px] font-bold transition-colors ${
              tab === t.key
                ? "border-iris bg-iris text-white"
                : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
            }`}
          >
            <i className={`ti ${t.icon} text-[14px]`} aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "copy" ? (
        <div className="flex flex-wrap gap-1.5">
          {COPY_KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => setCopyKind(k.key)}
              className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
                copyKind === k.key
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      ) : null}

      {tab !== "brief" ? (
        <input
          type="text"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder={
            tab === "copy"
              ? "추가 지시 (예: 신규 회원 30% 할인 강조)"
              : "추가 지시 (예: 미니멀, 일본 무인양품 느낌)"
          }
          className="w-full rounded-md border border-ink-15 bg-white px-3 py-2 text-[12.5px] outline-none focus:border-iris/60"
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-100 px-3.5 font-display text-[12.5px] font-bold text-white hover:bg-ink-90 disabled:opacity-60"
        >
          <i className="ti ti-sparkles text-[14px]" aria-hidden />
          {pending ? "생성 중…" : "AI 생성"}
        </button>
        {meta.provider ? (
          <span className="text-[11px] text-ink-50">
            {meta.provider} · {meta.model}
          </span>
        ) : null}
      </div>

      <textarea
        rows={tab === "brief" ? 16 : 10}
        value={output}
        onChange={(e) => setOutput(e.target.value)}
        placeholder="AI 결과가 여기에 표시됩니다. 결과는 자유롭게 편집할 수 있습니다."
        className="w-full resize-y rounded-lg border border-ink-15 bg-ink-100/[0.02] px-3 py-2.5 font-mono text-[12.5px] leading-[1.65] text-ink-100 outline-none focus:border-iris/60"
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={copyToClipboard}
          disabled={!output}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-15 bg-white px-2.5 text-[11.5px] font-semibold text-ink-70 hover:border-ink-30 hover:text-ink-100 disabled:opacity-50"
        >
          <i className="ti ti-copy text-[13px]" aria-hidden />
          클립보드 복사
        </button>
      </div>
    </div>
  );
}
