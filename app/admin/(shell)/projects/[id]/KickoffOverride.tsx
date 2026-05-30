"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { forceKickoffProjectAction } from "@/lib/actions/projects-kickoff";
import { useToast } from "@/components/admin/Toast";

export function KickoffOverride({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function submit() {
    if (!reason.trim()) {
      push("강제 착수 사유를 입력해주세요", "error");
      return;
    }
    startTransition(async () => {
      const r = await forceKickoffProjectAction(projectId, reason);
      if (r.ok) {
        push("관리자 권한으로 강제 착수했습니다 (감사 로그 기록)");
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        push(r.error ?? "처리 실패", "error");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-lg border border-warning/40 bg-warning/[0.06] px-3 py-2 font-display text-[12px] font-bold text-warning hover:bg-warning/10"
      >
        관리자 강제 착수 (Override)
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-warning/40 bg-warning/[0.06] p-3">
      <p className="text-[11.5px] text-ink-70">
        계약 미서명/미결제 상태에서도 강제로 진행중으로 변경합니다. 사유는 감사
        로그에 기록됩니다.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="예: 오프라인 계약 체결 / 구두 합의 후 선착수"
        className="mt-2 w-full resize-y rounded-md border border-ink-15 px-2.5 py-2 text-[12.5px]"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={pending || !reason.trim()}
          onClick={submit}
          className="rounded-lg bg-warning px-3 py-1.5 font-display text-[12px] font-bold text-white disabled:opacity-50"
        >
          강제 착수
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-ink-15 px-3 py-1.5 font-display text-[12px] font-bold text-ink-70"
        >
          취소
        </button>
      </div>
    </div>
  );
}
