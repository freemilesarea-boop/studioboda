"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setReviewStatusAction,
  toggleReviewFeaturedAction,
} from "@/lib/actions/reviews";
import { type ReviewStatus } from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";

const STATUS_LABELS: { value: Extract<ReviewStatus, "approved" | "rejected" | "hidden">; label: string }[] = [
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" },
  { value: "hidden", label: "숨김" },
];

export function ReviewActions({
  id,
  status,
  isFeatured,
}: {
  id: string;
  status: ReviewStatus;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();

  function setStatus(next: ReviewStatus, label: string) {
    if (next === status) return;
    startTransition(async () => {
      const res = await setReviewStatusAction(id, next);
      if (res.ok) {
        push(`후기를 ${label} 처리했습니다`);
        router.refresh();
      } else {
        push(res.error ?? "처리 실패", "error");
      }
    });
  }

  function toggleFeatured() {
    startTransition(async () => {
      const res = await toggleReviewFeaturedAction(id, !isFeatured);
      if (res.ok) {
        push(isFeatured ? "추천을 해제했습니다" : "추천으로 설정했습니다");
        router.refresh();
      } else {
        push(res.error ?? "처리 실패", "error");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STATUS_LABELS.map(({ value, label }) => {
        const active = status === value;
        return (
          <button
            key={value}
            type="button"
            disabled={pending || active}
            onClick={() => setStatus(value, label)}
            className={`rounded-lg px-3 py-1.5 font-display text-[12px] font-bold disabled:opacity-50 ${
              active
                ? "bg-ink-100 text-white"
                : "border border-ink-15 bg-white text-ink-70 hover:border-ink-30"
            }`}
          >
            {label}
          </button>
        );
      })}
      <button
        type="button"
        disabled={pending}
        onClick={toggleFeatured}
        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-display text-[12px] font-bold disabled:opacity-50 ${
          isFeatured
            ? "bg-iris text-white"
            : "border border-ink-15 bg-white text-iris hover:border-iris/40"
        }`}
      >
        <i className="ti ti-star-filled" aria-hidden />
        {isFeatured ? "추천 해제" : "추천"}
      </button>
    </div>
  );
}
