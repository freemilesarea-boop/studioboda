"use client";

import { useTransition } from "react";
import { signedFileUrlAction } from "@/lib/actions/projects";
import { useToast } from "@/components/admin/Toast";
import type { RevisionAttachment } from "@/lib/types/db";

const fmtSize = (n: number | null) => {
  if (!n) return "—";
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
};

/** 고객이 브리프에 첨부한 참고 파일 — 운영팀이 열람·다운로드. */
export function BriefAttachments({ attachments }: { attachments: RevisionAttachment[] }) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function open(path: string) {
    startTransition(async () => {
      const r = await signedFileUrlAction(path);
      if (r.ok && r.url) window.open(r.url, "_blank", "noopener");
      else push((r as { error?: string }).error ?? "링크 발급 실패", "error");
    });
  }

  if (attachments.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
        참고 첨부파일
      </p>
      <ul className="mt-1.5 divide-y divide-ink-15 rounded-lg border border-ink-15">
        {attachments.map((a) => (
          <li key={a.path} className="flex items-center gap-2.5 px-3 py-2 text-[12px]">
            <i className="ti ti-file text-[15px] text-ink-50" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-ink-100" title={a.name}>
              {a.name}
            </span>
            <span className="num text-[10.5px] text-ink-50">{fmtSize(a.size)}</span>
            <button
              type="button"
              onClick={() => open(a.path)}
              disabled={pending}
              className="font-display text-[11px] font-bold text-iris hover:opacity-80 disabled:opacity-60"
            >
              열기
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
