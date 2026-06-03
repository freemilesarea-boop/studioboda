"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { getInquiryFileUrlAction } from "@/lib/actions/inquiries";
import {
  inquiryFileCategoryLabels,
  type InquiryFile,
  type InquiryFileCategory,
} from "@/lib/types/db";

const fmtSize = (n: number | null) => {
  if (!n) return "—";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export function InquiryFilesPanel({ files }: { files: InquiryFile[] }) {
  const [pending, startTransition] = useTransition();

  function download(id: string) {
    startTransition(async () => {
      const r = await getInquiryFileUrlAction(id);
      if (r.ok && r.url) window.open(r.url, "_blank", "noopener");
      else alert((r as { error?: string }).error ?? "다운로드 실패");
    });
  }

  if (files.length === 0) {
    return <p className="text-[12.5px] text-ink-50">첨부된 자료가 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-ink-15">
      {files.map((f) => {
        const cat = (f.category as InquiryFileCategory) ?? null;
        return (
          <li key={f.id} className="flex items-center gap-3 py-2.5 text-[12.5px]">
            <i className="ti ti-file text-[16px] text-ink-50" aria-hidden />
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => download(f.id)}
                disabled={pending}
                className="block truncate text-left font-display font-bold text-ink-100 hover:text-iris disabled:opacity-60"
                title={f.file_name}
              >
                {f.file_name}
              </button>
              <p className="mt-0.5 text-[10.5px] text-ink-50">
                {cat ? `${inquiryFileCategoryLabels[cat]} · ` : ""}
                {fmtSize(f.file_size)} ·{" "}
                {format(new Date(f.created_at), "yyyy-MM-dd HH:mm")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => download(f.id)}
              disabled={pending}
              className="rounded-md border border-ink-15 px-2.5 py-1 text-[11px] font-bold text-ink-70 hover:border-iris hover:text-iris disabled:opacity-60"
            >
              다운로드
            </button>
          </li>
        );
      })}
    </ul>
  );
}
