"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateQuoteBriefAction } from "@/lib/actions/ai";
import { useToast } from "@/components/admin/Toast";

export function QuoteBriefClient({
  quoteId,
  initialText,
  initialMeta,
}: {
  quoteId: string;
  initialText: string;
  initialMeta?: { provider?: string; model?: string; createdAt?: string };
}) {
  const [output, setOutput] = useState(initialText);
  const [meta, setMeta] = useState(initialMeta ?? {});
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function run() {
    startTransition(async () => {
      const r = await generateQuoteBriefAction(quoteId);
      if (r.ok) {
        setOutput(r.text);
        setMeta({ provider: r.provider, model: r.model });
        push("브리프가 생성되었습니다");
        router.refresh();
      } else {
        push(r.error ?? "생성 실패", "error");
      }
    });
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      push("복사되었습니다");
    } catch {
      push("복사 실패", "error");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink-100 px-4 font-display text-[13px] font-bold text-white hover:bg-ink-90 disabled:opacity-60"
        >
          <i className="ti ti-sparkles text-[15px]" aria-hidden />
          {pending ? "생성 중…" : output ? "다시 생성" : "AI 브리프 생성"}
        </button>
        {meta.provider ? (
          <span className="text-[11px] text-ink-50">
            {meta.provider} · {meta.model}
            {meta.createdAt ? ` · ${meta.createdAt}` : ""}
          </span>
        ) : null}
      </div>

      <textarea
        rows={28}
        value={output}
        onChange={(e) => setOutput(e.target.value)}
        placeholder="견적 단계에서 미리 만들어둘 수 있는 AI 브리프입니다. 프로젝트로 전환 후 그대로 활용하거나 보강할 수 있습니다."
        className="w-full resize-y rounded-lg border border-ink-15 bg-ink-100/[0.02] px-4 py-3 font-mono text-[13px] leading-[1.7] text-ink-100 outline-none focus:border-iris/60"
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={copy}
          disabled={!output}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-15 bg-white px-3 text-[12px] font-semibold text-ink-70 hover:border-ink-30 hover:text-ink-100 disabled:opacity-50"
        >
          <i className="ti ti-copy text-[13px]" aria-hidden />
          클립보드 복사
        </button>
      </div>
    </div>
  );
}
