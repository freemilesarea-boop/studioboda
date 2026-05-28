"use client";

import { useToast } from "@/components/admin/Toast";

export function AIAssetCopyButton({ text }: { text: string }) {
  const { push } = useToast();
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      push("복사되었습니다");
    } catch {
      push("복사 실패", "error");
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-7 items-center gap-1 rounded-md border border-ink-15 bg-white px-2 text-[11px] font-semibold text-ink-70 hover:border-ink-30 hover:text-ink-100"
    >
      <i className="ti ti-copy text-[12px]" aria-hidden />
      복사
    </button>
  );
}
