"use client";

import { useEffect } from "react";

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
const PDF_EXT = ["pdf"];

const extOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
};

/** 이미지·PDF만 인브라우저 미리보기 지원. */
export function isPreviewable(name: string): boolean {
  const e = extOf(name);
  return IMAGE_EXT.includes(e) || PDF_EXT.includes(e);
}

export function FilePreviewModal({
  url,
  fileName,
  onClose,
}: {
  url: string;
  fileName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const ext = extOf(fileName);
  const isImage = IMAGE_EXT.includes(ext);
  const isPdf = PDF_EXT.includes(ext);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/70 p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 pb-3">
        <p className="truncate font-display text-[13px] font-bold text-white" title={fileName}>
          {fileName}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={url}
            download={fileName}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-white/30 px-3 py-1.5 font-display text-[12px] font-bold text-white hover:bg-white/10"
          >
            다운로드
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/30 px-3 py-1.5 font-display text-[12px] font-bold text-white hover:bg-white/10"
          >
            닫기 ✕
          </button>
        </div>
      </div>

      <div
        className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center overflow-auto rounded-xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={fileName} className="max-h-full max-w-full object-contain" />
        ) : isPdf ? (
          <iframe src={url} title={fileName} className="h-full w-full rounded-xl" />
        ) : (
          <div className="p-10 text-center text-[13px] text-ink-50">
            이 형식은 미리보기를 지원하지 않습니다. 다운로드해 확인해주세요.
          </div>
        )}
      </div>
    </div>
  );
}
