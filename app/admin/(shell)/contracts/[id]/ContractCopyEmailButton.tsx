"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendContractCopyEmailAction } from "@/lib/actions/contracts";
import { useToast } from "@/components/admin/Toast";

function fmtStamp(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * "계약자에게 메일 발송" — emails a signed-contract copy (view link) to the
 * client. Enabled only for signed contracts with a recipient email. Sending is
 * allowed multiple times; the last successful send time is shown.
 */
export function ContractCopyEmailButton({
  contractId,
  signed,
  recipientEmail,
  lastSentAt,
}: {
  contractId: string;
  signed: boolean;
  recipientEmail: string | null;
  lastSentAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [sentAt, setSentAt] = useState<string | null>(lastSentAt);
  const { push } = useToast();
  const router = useRouter();

  // Not signed → disabled with guidance.
  if (!signed) {
    return (
      <button
        type="button"
        disabled
        title="서명이 완료된 계약서만 발송할 수 있습니다"
        className="cursor-not-allowed rounded-lg border border-ink-15 bg-ink-5 px-3 py-1.5 font-display text-[12px] font-bold text-ink-50"
      >
        서명 완료 후 발송 가능
      </button>
    );
  }

  const noEmail = !recipientEmail;

  function send() {
    startTransition(async () => {
      const r = await sendContractCopyEmailAction(contractId);
      if (r.ok) {
        setSentAt(r.sentAt);
        push("계약서 사본 메일을 발송했습니다.");
        router.refresh();
      } else {
        push(r.error ?? "메일 발송에 실패했습니다", "error");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={send}
        disabled={pending || noEmail}
        title={noEmail ? "계약자 이메일이 없어 발송할 수 없습니다" : undefined}
        className="rounded-lg border border-iris bg-iris px-3 py-1.5 font-display text-[12px] font-bold text-white transition-colors hover:bg-iris/90 disabled:cursor-not-allowed disabled:border-ink-15 disabled:bg-ink-5 disabled:text-ink-50"
      >
        {pending ? "발송 중…" : "계약자에게 메일 발송"}
      </button>
      {noEmail ? (
        <span className="text-[11px] text-error">계약자 이메일 없음</span>
      ) : sentAt ? (
        <span className="text-[11px] text-ink-50">
          마지막 발송: {fmtStamp(sentAt)}
        </span>
      ) : null}
    </div>
  );
}
