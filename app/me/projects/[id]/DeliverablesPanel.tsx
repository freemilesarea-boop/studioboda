"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { downloadDeliverableAction } from "@/lib/actions/project-workspace";
import type { ProjectDeliverable } from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";
import { fmtSize } from "./uploadClient";
import { FilePreviewModal, isPreviewable } from "./FilePreviewModal";

export function DeliverablesPanel({
  deliverables,
}: {
  deliverables: ProjectDeliverable[];
}) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const { push } = useToast();

  function download(id: string) {
    startTransition(async () => {
      const r = await downloadDeliverableAction(id);
      if (r.ok) window.open(r.url, "_blank", "noopener");
      else push(r.error ?? "다운로드 실패", "error");
    });
  }

  function openPreview(id: string, name: string) {
    startTransition(async () => {
      const r = await downloadDeliverableAction(id, true);
      if (r.ok) setPreview({ url: r.url, name });
      else push(r.error ?? "미리보기 실패", "error");
    });
  }

  if (deliverables.length === 0) {
    return (
      <div className="grid place-items-center py-12 text-center">
        <div>
          <i className="ti ti-package text-[30px] text-ink-30" aria-hidden />
          <p className="mt-2 text-[12.5px] text-ink-50">
            아직 전달된 산출물이 없습니다. 작업이 완료되면 이곳에서 받아보실 수
            있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {deliverables.map((d) => (
        <li
          key={d.id}
          className={`rounded-xl border p-4 ${
            d.is_latest ? "border-iris/40 bg-iris/[0.04]" : "border-ink-15 bg-white"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="num inline-flex items-center rounded-md bg-ink-100 px-2 py-0.5 font-display text-[11px] font-bold text-white">
              v{d.version}
            </span>
            {d.is_latest ? (
              <span className="rounded-full bg-iris/15 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption text-iris">
                최신 버전
              </span>
            ) : null}
            <h4 className="font-display text-[13.5px] font-bold text-ink-100">{d.title}</h4>
          </div>
          {d.notes ? (
            <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-body text-ink-70">{d.notes}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-3">
            <i className="ti ti-file-zip text-[18px] text-ink-50" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[12.5px] font-bold text-ink-100" title={d.file_name}>
                {d.file_name}
              </p>
              <p className="text-[10.5px] text-ink-50">
                {fmtSize(d.file_size)} · {format(new Date(d.created_at), "yyyy-MM-dd HH:mm")}
              </p>
            </div>
            {isPreviewable(d.file_name) ? (
              <button
                type="button"
                onClick={() => openPreview(d.id, d.file_name)}
                disabled={pending}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-15 px-3 font-display text-[12px] font-bold text-ink-70 hover:border-iris hover:text-iris disabled:opacity-60"
              >
                <i className="ti ti-eye text-[14px]" aria-hidden />
                미리보기
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => download(d.id)}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-iris px-4 font-display text-[12px] font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              <i className="ti ti-download text-[14px]" aria-hidden />
              다운로드
            </button>
          </div>
        </li>
      ))}
      {preview ? (
        <FilePreviewModal
          url={preview.url}
          fileName={preview.name}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </ul>
  );
}
