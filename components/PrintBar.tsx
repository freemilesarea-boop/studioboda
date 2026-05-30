"use client";

import Link from "next/link";

/** Generic print toolbar: back link + browser print/PDF trigger. */
export function PrintBar({
  backHref,
  backLabel = "← 돌아가기",
}: {
  backHref: string;
  backLabel?: string;
}) {
  return (
    <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-ink-15 bg-white px-5 py-3 text-[12.5px]">
      <Link href={backHref} className="text-iris hover:underline">
        {backLabel}
      </Link>
      <p className="hidden text-ink-50 sm:block">
        브라우저 인쇄 (Cmd+P / Ctrl+P) → PDF 저장
      </p>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-ink-100 px-3 py-1.5 font-display text-[12px] font-bold text-white hover:bg-ink-90"
      >
        인쇄 / PDF 저장
      </button>
    </div>
  );
}
