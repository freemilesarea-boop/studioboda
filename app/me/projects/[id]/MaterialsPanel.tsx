"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  confirmMaterialUploadAction,
  createWorkspaceUploadUrlAction,
  deleteMaterialAction,
  downloadProjectAttachmentAction,
} from "@/lib/actions/project-workspace";
import {
  FILE_CATEGORIES,
  fileCategoryLabels,
  type FileCategory,
  type ProjectFile,
} from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";
import { fmtSize, uploadToSignedUrl } from "./uploadClient";
import { FilePreviewModal, isPreviewable } from "./FilePreviewModal";

const MAX = 100 * 1024 * 1024;
const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.ppt,.pptx,.zip";

type Uploading = { id: string; name: string; pct: "uploading" | "done" | "error"; error?: string };

const CAT_ICON: Record<FileCategory, string> = {
  logo: "ti-photo-star",
  product: "ti-camera",
  reference: "ti-link",
  document: "ti-file-text",
  etc: "ti-folder",
};

export function MaterialsPanel({
  projectId,
  myUserId,
  files,
}: {
  projectId: string;
  myUserId: string;
  files: ProjectFile[];
}) {
  const [category, setCategory] = useState<FileCategory>("logo");
  const [drag, setDrag] = useState(false);
  const [uploads, setUploads] = useState<Uploading[]>([]);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  const mine = useMemo(
    () => files.filter((f) => f.uploaded_by === myUserId),
    [files, myUserId],
  );
  const shared = useMemo(
    () => files.filter((f) => f.uploaded_by !== myUserId),
    [files, myUserId],
  );

  async function uploadOne(file: File) {
    const id = Math.random().toString(36).slice(2);
    setUploads((a) => [...a, { id, name: file.name, pct: "uploading" }]);
    const setState = (pct: Uploading["pct"], error?: string) =>
      setUploads((a) => a.map((u) => (u.id === id ? { ...u, pct, error } : u)));

    if (file.size > MAX) {
      setState("error", "100MB 초과");
      return false;
    }
    const urlRes = await createWorkspaceUploadUrlAction(projectId, "material", file.name);
    if (!urlRes.ok) {
      setState("error", urlRes.error);
      return false;
    }
    const up = await uploadToSignedUrl(urlRes.path, urlRes.token, file);
    if (!up.ok) {
      setState("error", up.error);
      return false;
    }
    const conf = await confirmMaterialUploadAction(projectId, {
      path: urlRes.path,
      fileName: file.name,
      size: file.size,
      type: file.type || null,
      category,
    });
    if (!conf.ok) {
      setState("error", conf.error);
      return false;
    }
    setState("done");
    return true;
  }

  function handleFiles(list: FileList | File[]) {
    const arr = Array.from(list).filter((f) => f.size > 0);
    if (arr.length === 0) return;
    startTransition(async () => {
      let okCount = 0;
      for (const f of arr) {
        if (await uploadOne(f)) okCount += 1;
      }
      if (okCount > 0) push(`${okCount}개 파일 업로드 완료`, "success");
      router.refresh();
      setTimeout(() => setUploads((a) => a.filter((u) => u.pct === "uploading")), 2500);
    });
  }

  function download(f: ProjectFile) {
    startTransition(async () => {
      const r = await downloadProjectAttachmentAction(projectId, f.file_path, f.file_name);
      if (r.ok) window.open(r.url, "_blank", "noopener");
      else push(r.error ?? "다운로드 실패", "error");
    });
  }

  function openPreview(f: ProjectFile) {
    startTransition(async () => {
      const r = await downloadProjectAttachmentAction(projectId, f.file_path, f.file_name, true);
      if (r.ok) setPreview({ url: r.url, name: f.file_name });
      else push(r.error ?? "미리보기 실패", "error");
    });
  }

  function remove(id: string) {
    if (!confirm("이 파일을 삭제할까요?")) return;
    startTransition(async () => {
      const r = await deleteMaterialAction(id);
      if (r.ok) {
        push("삭제되었습니다");
        router.refresh();
      } else push(r.error ?? "삭제 실패", "error");
    });
  }

  return (
    <div className="space-y-5">
      {/* Category picker + dropzone */}
      <div>
        <p className="mb-2 text-[11.5px] font-display font-bold text-ink-70">
          분류 선택 후 업로드
        </p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {FILE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-display text-[12px] font-bold transition-colors ${
                category === c
                  ? "border-iris bg-iris text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              <i className={`ti ${CAT_ICON[c]} text-[14px]`} aria-hidden />
              {fileCategoryLabels[c]}
            </button>
          ))}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
          }}
          className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
            drag ? "border-iris bg-iris-light" : "border-ink-15 bg-ink-5"
          }`}
        >
          <i className="ti ti-cloud-upload text-[26px] text-ink-50" aria-hidden />
          <p className="mt-1.5 text-[12.5px] text-ink-70">
            <label className="cursor-pointer font-display font-bold text-iris hover:underline">
              파일 선택
              <input
                type="file"
                multiple
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>{" "}
            또는 여기로 끌어다 놓기
          </p>
          <p className="mt-0.5 text-[10.5px] text-ink-50">
            jpg · png · webp · pdf · doc · ppt · zip · 최대 100MB · 복수 선택 가능
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
                    u.pct === "done"
                      ? "ti-circle-check text-success"
                      : u.pct === "error"
                      ? "ti-alert-triangle text-error"
                      : "ti-loader-2 animate-spin text-iris"
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-ink-100">{u.name}</span>
                <span
                  className={
                    u.pct === "done"
                      ? "text-success"
                      : u.pct === "error"
                      ? "text-error"
                      : "text-iris"
                  }
                >
                  {u.pct === "done" ? "완료" : u.pct === "error" ? u.error ?? "실패" : "업로드 중…"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <FileList
        title="내가 올린 자료"
        empty="아직 업로드한 자료가 없습니다."
        files={mine}
        onDownload={download}
        onPreview={openPreview}
        onRemove={remove}
        pending={pending}
      />
      <FileList
        title="운영팀 공유 자료"
        empty="운영팀이 공유한 자료가 없습니다."
        files={shared}
        onDownload={download}
        onPreview={openPreview}
        pending={pending}
      />
      {preview ? (
        <FilePreviewModal
          url={preview.url}
          fileName={preview.name}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}

function FileList({
  title,
  empty,
  files,
  onDownload,
  onPreview,
  onRemove,
  pending,
}: {
  title: string;
  empty: string;
  files: ProjectFile[];
  onDownload: (f: ProjectFile) => void;
  onPreview?: (f: ProjectFile) => void;
  onRemove?: (id: string) => void;
  pending: boolean;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-caption text-ink-50">
        {title}
        <span className="num rounded-full bg-ink-5 px-1.5 text-[10px] text-ink-70">
          {files.length}
        </span>
      </h3>
      {files.length === 0 ? (
        <p className="text-[12.5px] text-ink-50">{empty}</p>
      ) : (
        <ul className="divide-y divide-ink-15 rounded-lg border border-ink-15">
          {files.map((f) => {
            const cat = (f.category as FileCategory) ?? null;
            return (
              <li key={f.id} className="flex items-center gap-3 px-3 py-2.5 text-[12.5px]">
                <i
                  className={`ti ${cat ? CAT_ICON[cat] : "ti-file"} text-[16px] text-ink-50`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onDownload(f)}
                    disabled={pending}
                    className="block truncate text-left font-display font-bold text-ink-100 hover:text-iris disabled:opacity-60"
                    title={f.file_name}
                  >
                    {f.file_name}
                  </button>
                  <p className="mt-0.5 text-[10.5px] text-ink-50">
                    {cat ? `${fileCategoryLabels[cat]} · ` : ""}
                    {fmtSize(f.file_size)} · {format(new Date(f.created_at), "yyyy-MM-dd HH:mm")}
                  </p>
                </div>
                {onPreview && isPreviewable(f.file_name) ? (
                  <button
                    type="button"
                    onClick={() => onPreview(f)}
                    disabled={pending}
                    className="text-[11px] font-bold text-ink-50 hover:text-iris disabled:opacity-60"
                  >
                    미리보기
                  </button>
                ) : null}
                {onRemove ? (
                  <button
                    type="button"
                    onClick={() => onRemove(f.id)}
                    disabled={pending}
                    className="text-[11px] text-ink-50 hover:text-error disabled:opacity-60"
                  >
                    삭제
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
