"use client";

import { useMemo, useState, useTransition } from "react";
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

const FOLDERS: FileFolder[] = ["draft", "revision", "final"];

type Upload = {
  id: string;
  name: string;
  size: number;
  state: "uploading" | "done" | "error";
  error?: string;
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
  const [tab, setTab] = useState<FileFolder | "all">("all");
  const [drag, setDrag] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const { push } = useToast();
  const router = useRouter();

  const counts = useMemo(() => {
    const c: Record<FileFolder, number> = { draft: 0, revision: 0, final: 0 };
    for (const f of files) c[f.folder] += 1;
    return c;
  }, [files]);

  const visibleFiles =
    tab === "all" ? files : files.filter((f) => f.folder === tab);

  async function uploadOne(file: File) {
    const id = Math.random().toString(36).slice(2);
    setUploads((arr) => [
      ...arr,
      { id, name: file.name, size: file.size, state: "uploading" },
    ]);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("visibility", visibility);
    fd.set("folder", folder);
    const r = await uploadProjectFileAction(projectId, fd);
    setUploads((arr) =>
      arr.map((u) =>
        u.id === id
          ? {
              ...u,
              state: r.ok ? "done" : "error",
              error: r.ok ? undefined : (r as { error?: string }).error,
            }
          : u,
      ),
    );
    return r;
  }

  async function handleFiles(list: FileList | File[]) {
    const arr = Array.from(list).filter((f) => f.size > 0);
    if (arr.length === 0) return;
    startTransition(async () => {
      let okCount = 0;
      for (const f of arr) {
        const r = await uploadOne(f);
        if (r.ok) okCount += 1;
        else push(r.error ?? `${f.name} 업로드 실패`, "error");
      }
      if (okCount > 0) push(`${okCount}개 파일 업로드 완료`);
      router.refresh();
      // Clear "done" tiles after a moment so the list stays clean
      setTimeout(() => {
        setUploads((arr) => arr.filter((u) => u.state === "uploading"));
      }, 2500);
    });
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    void handleFiles(e.target.files);
    e.target.value = ""; // allow re-pick same file
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDrag(false);
    if (!e.dataTransfer?.files?.length) return;
    void handleFiles(e.dataTransfer.files);
  }

  async function open(fp: string) {
    const r = await signedFileUrlAction(fp);
    if (r.ok && r.url) window.open(r.url, "_blank", "noopener");
    else push((r as { error?: string }).error ?? "링크 발급 실패", "error");
  }

  function remove(id: string) {
    if (!confirm("이 파일을 삭제할까요?")) return;
    startTransition(async () => {
      const r = await deleteProjectFileAction(id);
      if (r.ok) {
        push("삭제 완료");
        router.refresh();
      } else {
        push((r as { error?: string }).error ?? "삭제 실패", "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Folder tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
            tab === "all"
              ? "border-ink-100 bg-ink-100 text-white"
              : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
          }`}
        >
          전체{" "}
          <span className="num ml-0.5 text-[10.5px]">{files.length}</span>
        </button>
        {FOLDERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setTab(f)}
            className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
              tab === f
                ? "border-ink-100 bg-ink-100 text-white"
                : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
            }`}
          >
            {fileFolderLabels[f]}{" "}
            <span className="num ml-0.5 text-[10.5px]">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Drag-drop zone + controls */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          drag
            ? "border-iris bg-iris-light"
            : "border-ink-15 bg-ink-5"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-ink-15 bg-white px-3 font-display font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100">
            <i className="ti ti-upload text-[14px]" aria-hidden />
            파일 선택 (복수 가능)
            <input
              type="file"
              multiple
              onChange={onPick}
              className="hidden"
            />
          </label>
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value as FileFolder)}
            className="h-9 rounded-md border border-ink-15 bg-white px-2 text-[12px]"
          >
            {FOLDERS.map((f) => (
              <option key={f} value={f}>
                폴더: {fileFolderLabels[f]}
              </option>
            ))}
          </select>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className="h-9 rounded-md border border-ink-15 bg-white px-2 text-[12px]"
          >
            <option value="internal">내부 전용</option>
            <option value="client">클라이언트 공유</option>
          </select>
          <p className="ml-auto text-[11px] text-ink-50">
            또는 이 박스에 파일을 끌어놓으세요 · 25MB 이하
          </p>
        </div>

        {uploads.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {uploads.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-md border border-ink-15 bg-white px-3 py-1.5 text-[11.5px]"
              >
                <i
                  className={`ti text-[14px] ${
                    u.state === "done"
                      ? "ti-circle-check text-success"
                      : u.state === "error"
                      ? "ti-alert-triangle text-error"
                      : "ti-loader-2 animate-spin text-iris"
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-ink-100">
                  {u.name}
                </span>
                <span className="text-ink-50">{fmtSize(u.size)}</span>
                <span
                  className={
                    u.state === "done"
                      ? "text-success"
                      : u.state === "error"
                      ? "text-error"
                      : "text-iris"
                  }
                >
                  {u.state === "done"
                    ? "완료"
                    : u.state === "error"
                    ? u.error ?? "실패"
                    : "업로드 중…"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {visibleFiles.length === 0 ? (
        <p className="text-[12.5px] text-ink-50">
          이 폴더에 업로드된 파일이 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-ink-15">
          {visibleFiles.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 py-2.5 text-[12.5px]"
            >
              <i
                className={`ti ${f.is_final ? "ti-medal text-iris" : "ti-file text-ink-50"} text-[16px]`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => open(f.file_path)}
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
                  · {f.visibility === "client" ? "고객 공개" : "내부 전용"} ·{" "}
                  {format(new Date(f.created_at), "yyyy-MM-dd HH:mm")}
                  {f.is_final ? " · 최종 산출물" : ""}
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
