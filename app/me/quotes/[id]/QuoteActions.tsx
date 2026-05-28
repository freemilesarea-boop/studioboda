"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptMyQuoteAction,
  rejectMyQuoteAction,
} from "@/lib/actions/customer";
import type { QuoteStatus } from "@/lib/types/db";
import { quoteStatusLabels } from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";

export function QuoteActions({
  quoteId,
  canActOn,
  currentStatus,
}: {
  quoteId: string;
  canActOn: boolean;
  currentStatus: QuoteStatus;
}) {
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function accept() {
    const ok = window.confirm(
      "이 견적을 수락하시겠습니까? 수락 후 운영팀이 프로젝트 시작 안내를 발송합니다.",
    );
    if (!ok) return;
    startTransition(async () => {
      const r = await acceptMyQuoteAction(quoteId);
      if (r.ok) {
        push("견적이 수락되었습니다");
        router.refresh();
      } else {
        push(r.error ?? "처리 실패", "error");
      }
    });
  }

  function submitReject() {
    if (!reason.trim()) {
      push("거절 사유를 입력해주세요", "error");
      return;
    }
    startTransition(async () => {
      const r = await rejectMyQuoteAction(quoteId, reason);
      if (r.ok) {
        push("거절 의사가 전달되었습니다");
        setMode("idle");
        setReason("");
        router.refresh();
      } else {
        push(r.error ?? "처리 실패", "error");
      }
    });
  }

  if (!canActOn) {
    return (
      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <p className="text-[12.5px] text-ink-50">
          이 견적은 현재 상태에서 수락/거절이 불가합니다.{" "}
          <b className="text-ink-100">{quoteStatusLabels[currentStatus]}</b>
        </p>
      </section>
    );
  }

  if (mode === "rejecting") {
    return (
      <section className="rounded-2xl border border-error/30 bg-error/[0.05] p-5">
        <h2 className="font-display text-[14px] font-bold text-ink-100">
          거절 사유
        </h2>
        <p className="mt-1 text-[12px] text-ink-50">
          운영팀이 견적을 다듬는데 참고합니다. 1000자 이내.
        </p>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={1000}
          className="mt-3 w-full resize-y rounded-md border border-ink-15 bg-white px-3 py-2 text-[13px] leading-body outline-none focus:border-iris/60"
          placeholder="예: 예산이 맞지 않습니다 / 일정이 더 빨라야 합니다 / 옵션 추가 검토 필요"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !reason.trim()}
            onClick={submitReject}
            className="inline-flex h-10 items-center rounded-lg bg-error px-4 font-display text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-60"
          >
            거절 전송
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMode("idle");
              setReason("");
            }}
            className="inline-flex h-10 items-center rounded-lg border border-ink-15 px-4 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
          >
            취소
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-ink-15 bg-white p-5">
      <h2 className="font-display text-[14px] font-bold text-ink-100">
        견적 결정
      </h2>
      <p className="mt-1 text-[12px] text-ink-50">
        견적을 검토하고 진행 여부를 알려주세요. 결제는 다음 단계에서 진행됩니다.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={accept}
          className="inline-flex h-11 items-center rounded-lg bg-iris px-5 font-display text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          이 견적으로 진행할게요 →
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setMode("rejecting")}
          className="inline-flex h-11 items-center rounded-lg border border-ink-15 px-5 font-display text-[13px] font-bold text-ink-70 hover:border-error/60 hover:text-error"
        >
          거절하기
        </button>
      </div>
    </section>
  );
}
