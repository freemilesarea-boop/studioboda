"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { getClientFileUrlAction } from "@/lib/actions/customer";
import type { ProjectFile } from "@/lib/types/db";
import { fileFolderLabels } from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";

const fmtSize = (n: number | null) => {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export function ClientFilesPanel({ files }: { files: ProjectFile[] }) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function download(fileId: string) {
    startTransition(async () => {
      const r = await getClientFileUrlAction(fileId);
      if (r.ok && r.url) {
        window.open(r.url, "_blank", "noopener");
      } else {
        push((r as { error?: string }).error ?? "다운로드 URL 발급 실패", "error");
      }
    });
  }

  if (files.length === 0) {
    return (
      <p className="text-[12.5px] text-ink-50">
        아직 공유된 파일이 없습니다.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink-15">
      {files.map((f) => (
        <li
          key={f.id}
          className="flex items-center gap-3 py-2.5 text-[13px]"
        >
          <i
            className={`ti ${f.is_final ? "ti-medal" : "ti-file"} text-[16px] ${
              f.is_final ? "text-iris" : "text-ink-50"
            }`}
            aria-hidden
          />
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
              {fmtSize(f.file_size)} ·{" "}
              <span className="font-display font-bold text-ink-70">
                {fileFolderLabels[f.folder]}
              </span>{" "}
              ·{" "}
              {format(new Date(f.created_at), "yyyy-MM-dd HH:mm")}
              {f.is_final ? " · 최종 산출물" : ""}
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
      ))}
    </ul>
  );
}
