"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deletePortfolioItemAction,
  setPortfolioFeaturedAction,
  setPortfolioStatusAction,
} from "@/lib/actions/portfolio";
import { useToast } from "@/components/admin/Toast";
import type { PortfolioStatus } from "@/lib/types/db";

export function PortfolioRowActions({
  id,
  slug,
  status,
  featured,
}: {
  id: string;
  slug: string;
  status: PortfolioStatus;
  featured: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  const nextStatus: PortfolioStatus =
    status === "published" ? "draft" : "published";

  function call(fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) {
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        push(msg);
        router.refresh();
      } else {
        push(r.error ?? "실패", "error");
      }
    });
  }

  function remove() {
    if (!window.confirm("이 케이스를 삭제하시겠습니까? (Storage 파일 포함)")) return;
    call(() => deletePortfolioItemAction(id), "삭제되었습니다");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === "published" ? (
        <Link
          href={`/portfolio/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1 rounded-md border border-ink-15 bg-white px-2.5 text-[11px] font-semibold text-ink-70 hover:border-ink-30 hover:text-ink-100"
        >
          <i className="ti ti-external-link text-[12px]" aria-hidden />
          미리보기
        </Link>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          call(
            () => setPortfolioFeaturedAction(id, !featured),
            featured ? "Featured 해제" : "Featured 지정",
          )
        }
        className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-[11px] font-semibold disabled:opacity-50 ${
          featured
            ? "border-iris bg-iris text-white"
            : "border-ink-15 bg-white text-ink-70 hover:border-ink-30 hover:text-ink-100"
        }`}
      >
        <i className="ti ti-star text-[12px]" aria-hidden />
        {featured ? "Featured" : "Feature"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          call(
            () => setPortfolioStatusAction(id, nextStatus),
            nextStatus === "published" ? "공개로 전환" : "비공개로 전환",
          )
        }
        className="inline-flex h-8 items-center gap-1 rounded-md border border-ink-15 bg-white px-2.5 text-[11px] font-semibold text-ink-70 hover:border-ink-30 hover:text-ink-100 disabled:opacity-50"
      >
        <i className="ti ti-eye text-[12px]" aria-hidden />
        {nextStatus === "published" ? "공개" : "비공개"}
      </button>
      <Link
        href={`/admin/portfolio/${id}`}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-ink-15 bg-white px-2.5 text-[11px] font-semibold text-ink-70 hover:border-ink-30 hover:text-ink-100"
      >
        편집 →
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={remove}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-error/30 bg-error/[0.06] px-2.5 text-[11px] font-semibold text-error hover:bg-error/[0.12] disabled:opacity-50"
      >
        삭제
      </button>
    </div>
  );
}
