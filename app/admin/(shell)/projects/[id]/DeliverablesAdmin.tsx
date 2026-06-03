"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { STORAGE_BUCKET } from "@/lib/env";
import {
  confirmDeliverableUploadAction,
  createDeliverableUploadUrlAction,
  deleteDeliverableAction,
  signedFileUrlAction,
} from "@/lib/actions/projects";
import type { ProjectDeliverable } from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";

const fmtSize = (n: number | null) => {
  if (!n) return "—";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export function DeliverablesAdmin({
  projectId,
  deliverables,
}: {
  projectId: string;
  deliverables: ProjectDeliverable[];
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  async function upload() {
    if (!file) {
      push("파일을 선택해주세요", "error");
      return;
    }
    setBusy(true);
    try {
      const urlRes = await createDeliverableUploadUrlAction(projectId, file.name);
      if (!urlRes.ok) {
        push(urlRes.error, "error");
        return;
      }
      const supabase = createBrowserSupabase();
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .uploadToSignedUrl(urlRes.path, urlRes.token, file, {
          contentType: file.type || "application/octet-stream",
        });
      if (error) {
        push(error.message, "error");
        return;
      }
      const conf = await confirmDeliverableUploadAction(projectId, {
        path: urlRes.path,
        fileName: file.name,
        size: file.size,
        type: file.type || null,
        title: title.trim() || file.name,
        notes,
      });
      if (conf.ok) {
        push(`v${conf.version} 산출물 업로드 완료`, "success");
        setTitle("");
        setNotes("");
        setFile(null);
        router.refresh();
      } else push(conf.error ?? "업로드 실패", "error");
    } finally {
      setBusy(false);
    }
  }

  function open(path: string) {
    startTransition(async () => {
      const r = await signedFileUrlAction(path);
      if (r.ok && r.url) window.open(r.url, "_blank", "noopener");
      else push("링크 발급 실패", "error");
    });
  }

  function remove(id: string) {
    if (!confirm("이 산출물을 삭제할까요?")) return;
    startTransition(async () => {
      const r = await deleteDeliverableAction(id);
      if (r.ok) {
        push("삭제됨");
        router.refresh();
      } else push(r.error ?? "삭제 실패", "error");
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-xl border border-iris/20 bg-iris/[0.04] p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="버전 제목 (예: 최종 시안)"
          className="h-9 w-full rounded-md border border-ink-15 bg-white px-2.5 text-[12.5px] outline-none focus:border-iris/60"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="버전 메모 (선택)"
          className="h-9 w-full rounded-md border border-ink-15 bg-white px-2.5 text-[12.5px] outline-none focus:border-iris/60"
        />
        <div className="flex items-center gap-2">
          <label className="inline-flex h-9 flex-1 cursor-pointer items-center gap-1.5 truncate rounded-md border border-ink-15 bg-white px-2.5 text-[12px] font-bold text-ink-70 hover:border-ink-30">
            <i className="ti ti-paperclip text-[14px]" aria-hidden />
            <span className="truncate">{file ? file.name : "파일 선택 (zip/pdf/png/jpg/mp4)"}</span>
            <input
              type="file"
              accept=".zip,.pdf,.png,.jpg,.jpeg,.mp4,.webp,.ai,.psd"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            onClick={upload}
            disabled={busy || !file}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-iris px-3 font-display text-[12px] font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            <i className={`ti ${busy ? "ti-loader-2 animate-spin" : "ti-upload"} text-[14px]`} aria-hidden />
            {busy ? "업로드 중…" : "새 버전 업로드"}
          </button>
        </div>
      </div>

      {deliverables.length === 0 ? (
        <p className="text-[12.5px] text-ink-50">업로드된 산출물이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-ink-15">
          {deliverables.map((d) => (
            <li key={d.id} className="flex items-center gap-2.5 py-2 text-[12.5px]">
              <span className="num inline-flex h-5 items-center rounded bg-ink-100 px-1.5 font-display text-[10px] font-bold text-white">
                v{d.version}
              </span>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => open(d.file_path)}
                  disabled={pending}
                  className="block truncate text-left font-display font-bold text-ink-100 hover:text-iris"
                  title={d.file_name}
                >
                  {d.title}
                </button>
                <p className="text-[10px] text-ink-50">
                  {d.file_name} · {fmtSize(d.file_size)} ·{" "}
                  {format(new Date(d.created_at), "yyyy-MM-dd HH:mm")}
                  {d.is_latest ? " · 최신" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(d.id)}
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
