"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  deleteProjectFileAction,
  signedFileUrlAction,
  uploadProjectFileAction,
} from "@/lib/actions/projects";
import type {
  FileFolder,
  ProjectFile,
  Visibility,
} from "@/lib/types/db";
import { fileFolderLabels } from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";

const fmtSize = (n: number | null) => {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export function FilesPanel({
  projectId,
  files,
}: {
  projectId: string;
  files: ProjectFile[];
}) {
  const [pending, startTransition] = useTransition();
  const [visibility, setVisibility] = useState<Visibility>("internal");
  const [folder, setFolder] = useState<FileFolder>("draft");
  const { push } = useToast();
  const router = useRouter();

  function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("visibility", visibility);
    fd.set("folder", folder);
    startTransition(async () => {
      const r = await uploadProjectFileAction(projectId, fd);
      if (r.ok) {
        push("업로드 완료");
        form.reset();
        router.refresh();
      } else {
        push(r.error ?? "업로드 실패", "error");
      }
    });
  }

  async function open(fp: string) {
    const r = await signedFileUrlAction(fp);
    if (r.ok && r.url) {
      window.open(r.url, "_blank", "noopener");
    } else {
      push((r as { error?: string }).error ?? "링크 발급 실패", "error");
    }
  }

  function remove(id: string) {
    if (!confirm("이 파일을 삭제할까요?")) return;
    startTransition(async () => {
      const r = await deleteProjectFileAction(id);
      if (r.ok) {
        push("삭제 완료");
        router.refresh();
      } else {
        push(r.error ?? "삭제 실패", "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={onUpload}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-ink-15 px-3 py-3"
      >
        <input
          type="file"
          name="file"
          required
          className="text-[12px] file:mr-2 file:rounded-md file:border file:border-ink-15 file:bg-white file:px-2.5 file:py-1.5 file:text-[12px] file:font-semibold file:text-ink-70 file:hover:border-ink-30"
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
          className="h-9 rounded-md border border-ink-15 bg-white px-2 text-[12px]"
        >
          <option value="internal">내부 전용</option>
          <option value="client">클라이언트 공유</option>
        </select>
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value as FileFolder)}
          className="h-9 rounded-md border border-ink-15 bg-white px-2 text-[12px]"
        >
          {(Object.keys(fileFolderLabels) as FileFolder[]).map((f) => (
            <option key={f} value={f}>
              {fileFolderLabels[f]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto h-9 rounded-md bg-ink-100 px-3 font-display text-[12px] font-bold text-white disabled:opacity-60"
        >
          {pending ? "업로드 중…" : "업로드"}
        </button>
      </form>

      {files.length === 0 ? (
        <p className="text-[12.5px] text-ink-50">아직 업로드된 파일이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-ink-15">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 py-2.5 text-[12.5px]"
            >
              <i className="ti ti-file text-[16px] text-ink-50" aria-hidden />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => open(f.file_path)}
                  className="block truncate font-display font-bold text-ink-100 hover:text-iris"
                >
                  {f.file_name}
                </button>
                <p className="mt-0.5 text-[10px] text-ink-50">
                  {fmtSize(f.file_size)} · {f.visibility} ·{" "}
                  {format(new Date(f.created_at), "yyyy-MM-dd HH:mm")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(f.id)}
                disabled={pending}
                className="text-[11px] text-ink-50 hover:text-error"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
