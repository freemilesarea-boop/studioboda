"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import {
  removePortfolioImageAction,
  removePortfolioProofAction,
  uploadPortfolioGalleryAction,
  uploadPortfolioProofAction,
  uploadPortfolioThumbnailAction,
} from "@/lib/actions/portfolio";
import type {
  PortfolioImage,
  PortfolioItem,
  PortfolioProof,
} from "@/lib/types/db";

export function PortfolioAssets({ item }: { item: PortfolioItem }) {
  return (
    <div className="space-y-5">
      <ThumbnailUploader item={item} />
      <GalleryUploader
        itemId={item.id}
        images={item.images ?? []}
      />
      <ProofUploader itemId={item.id} files={item.proof_files ?? []} />
    </div>
  );
}

function ThumbnailUploader({ item }: { item: PortfolioItem }) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function pick() {
    inputRef.current?.click();
  }
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const r = await uploadPortfolioThumbnailAction(item.id, fd);
      if (r.ok) {
        push("썸네일 업데이트");
        router.refresh();
      } else {
        push(r.error ?? "업로드 실패", "error");
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <section>
      <Header
        title="대표 썸네일"
        hint="랜딩 · /portfolio 카드에 노출. 16:9 권장, 최대 20MB."
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-ink-15 bg-ink-5 sm:w-72">
          {item.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnail_url}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-center text-ink-50">
              <span>
                <i className="ti ti-photo text-[24px]" aria-hidden />
                <p className="mt-2 text-[12px]">썸네일 없음</p>
              </span>
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={pick}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-ink-15 bg-white px-4 font-display text-[12.5px] font-bold text-ink-100 hover:border-ink-30 disabled:opacity-60"
          >
            <i className="ti ti-upload text-[14px]" aria-hidden />
            {pending ? "업로드 중…" : "썸네일 업로드"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onChange}
            hidden
          />
        </div>
      </div>
    </section>
  );
}

function GalleryUploader({
  itemId,
  images,
}: {
  itemId: string;
  images: PortfolioImage[];
}) {
  const [pending, setPending] = useState(false);
  const [drag, setDrag] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    if (!files || (files as FileList).length === 0) return;
    setPending(true);
    try {
      const fd = new FormData();
      for (const f of Array.from(files)) fd.append("files", f);
      const r = await uploadPortfolioGalleryAction(itemId, fd);
      if (r.ok) {
        push(`${r.uploaded.length}개 업로드`);
        router.refresh();
      } else {
        push(r.error ?? "업로드 실패", "error");
      }
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }

  function remove(url: string) {
    if (!window.confirm("이 이미지를 삭제하시겠습니까?")) return;
    setPending(true);
    removePortfolioImageAction(itemId, url)
      .then((r) => {
        if (r.ok) {
          push("삭제됨");
          router.refresh();
        } else {
          push(r.error ?? "삭제 실패", "error");
        }
      })
      .finally(() => setPending(false));
  }

  return (
    <section>
      <Header
        title="갤러리"
        hint="결과물 이미지를 여러 장 업로드합니다. drag & drop 지원."
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`mt-3 rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
          drag
            ? "border-iris bg-iris/[0.04]"
            : "border-ink-15 bg-white"
        }`}
      >
        <p className="text-[12.5px] text-ink-70">
          이미지를 끌어 놓거나{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-bold text-iris hover:underline"
          >
            파일 선택
          </button>
        </p>
        <p className="mt-1 text-[11px] text-ink-50">
          png · jpg · webp · gif · svg, 1장당 최대 20MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {pending ? (
          <p className="mt-2 text-[11px] text-ink-50">업로드 중…</p>
        ) : null}
      </div>

      {images.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-ink-50">아직 등록된 이미지가 없습니다.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <li
              key={img.url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-ink-15 bg-ink-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt ?? ""}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(img.url)}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-md bg-white/95 text-[12px] font-bold text-error opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="삭제"
              >
                <i className="ti ti-x" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProofUploader({
  itemId,
  files,
}: {
  itemId: string;
  files: PortfolioProof[];
}) {
  const [pending, setPending] = useState(false);
  const [drag, setDrag] = useState(false);
  const [internal, setInternal] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(list: FileList | File[]) {
    if (!list || (list as FileList).length === 0) return;
    setPending(true);
    try {
      const fd = new FormData();
      for (const f of Array.from(list)) fd.append("files", f);
      if (internal) fd.set("internal", "on");
      const r = await uploadPortfolioProofAction(itemId, fd);
      if (r.ok) {
        push(`${r.uploaded.length}개 인증 업로드`);
        router.refresh();
      } else {
        push(r.error ?? "업로드 실패", "error");
      }
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(url: string) {
    if (!window.confirm("이 인증 파일을 삭제하시겠습니까?")) return;
    setPending(true);
    removePortfolioProofAction(itemId, url)
      .then((r) => {
        if (r.ok) {
          push("삭제됨");
          router.refresh();
        } else {
          push(r.error ?? "삭제 실패", "error");
        }
      })
      .finally(() => setPending(false));
  }

  return (
    <section>
      <Header
        title="성과 인증 (proof)"
        hint="GA / Meta / 매출 캡처 · PDF 보고서. internal 체크 시 공개 페이지에 노출되지 않습니다."
      />
      <label className="mt-3 inline-flex items-center gap-2 text-[12px] text-ink-70">
        <input
          type="checkbox"
          checked={internal}
          onChange={(e) => setInternal(e.target.checked)}
          className="h-4 w-4 accent-iris"
        />
        새 업로드를 내부 전용으로 표시
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={`mt-3 rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
          drag ? "border-iris bg-iris/[0.04]" : "border-ink-15 bg-white"
        }`}
      >
        <p className="text-[12.5px] text-ink-70">
          이미지/PDF를 끌어 놓거나{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-bold text-iris hover:underline"
          >
            파일 선택
          </button>
        </p>
        <p className="mt-1 text-[11px] text-ink-50">
          png · jpg · webp · pdf, 1장당 최대 20MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {pending ? <p className="mt-2 text-[11px] text-ink-50">업로드 중…</p> : null}
      </div>

      {files.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-ink-50">등록된 인증 파일이 없습니다.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((f) => (
            <li
              key={f.url}
              className="flex items-center gap-3 rounded-lg border border-ink-15 bg-white px-3 py-2.5"
            >
              <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-ink-15 bg-ink-5">
                {f.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                ) : (
                  <i className="ti ti-file-type-pdf text-[18px] text-ink-50" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[12.5px] font-bold text-ink-100">
                  {f.name}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-50">
                  <span className="rounded-full bg-ink-5 px-1.5 py-0.5 font-mono text-[10px] uppercase">
                    {f.type}
                  </span>
                  {f.internal ? (
                    <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">
                      INTERNAL
                    </span>
                  ) : (
                    <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
                      PUBLIC
                    </span>
                  )}
                </div>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-ink-15 px-2 py-1 text-[11px] font-semibold text-ink-70 hover:border-ink-30 hover:text-ink-100"
              >
                열기
              </a>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(f.url)}
                className="rounded-md border border-error/30 bg-error/[0.06] px-2 py-1 text-[11px] font-semibold text-error hover:bg-error/[0.12] disabled:opacity-50"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Header({ title, hint }: { title: string; hint?: string }) {
  return (
    <header>
      <h3 className="font-display text-[14px] font-bold text-ink-100">{title}</h3>
      {hint ? <p className="mt-1 text-[12px] text-ink-50">{hint}</p> : null}
    </header>
  );
}
