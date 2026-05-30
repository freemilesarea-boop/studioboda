"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContractFromQuoteAction,
  resendContractEmailAction,
  sendContractAction,
} from "@/lib/actions/contracts";
import { useToast } from "@/components/admin/Toast";

const linkCls =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-15 bg-white px-3 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100";

export function QuoteContractButton({
  quoteId,
  contract,
}: {
  quoteId: string;
  contract: { id: string; status: string } | null;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function create() {
    startTransition(async () => {
      const r = await createContractFromQuoteAction(quoteId);
      if (r.ok) {
        push("계약서를 생성했습니다");
        router.push(`/admin/contracts/${r.contract_id}`);
      } else {
        push(r.error ?? "생성 실패", "error");
      }
    });
  }

  function send(contractId: string, resend: boolean) {
    startTransition(async () => {
      const r = resend
        ? await resendContractEmailAction(contractId)
        : await sendContractAction(contractId);
      if (r.ok) {
        push(
          resend
            ? "계약서를 재발송했습니다"
            : "계약서를 발송했습니다 (고객에게 계약서 + 예약금 결제 링크 이메일 발송)",
        );
        router.refresh();
      } else {
        push(r.error ?? "발송 실패", "error");
      }
    });
  }

  // No contract yet → 계약서 생성
  if (!contract) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={create}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-iris/30 bg-iris/10 px-3 font-display text-[12px] font-bold text-iris hover:bg-iris/15 disabled:opacity-50"
      >
        <i className="ti ti-file-plus text-[14px]" aria-hidden />
        계약서 생성
      </button>
    );
  }

  const isDraft = contract.status === "draft";
  const isSent = ["sent", "viewed"].includes(contract.status);

  return (
    <>
      {/* 미리보기 (인쇄 가능한 계약서 문서) */}
      <Link
        href={`/admin/print/contract/${contract.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkCls}
      >
        <i className="ti ti-eye text-[14px]" aria-hidden />
        계약서 미리보기
      </Link>

      {/* 상세 보기 */}
      <Link href={`/admin/contracts/${contract.id}`} className={linkCls}>
        <i className="ti ti-file-text text-[14px]" aria-hidden />
        계약서 보기
      </Link>

      {/* 발송 / 재발송 */}
      {isDraft ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => send(contract.id, false)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-iris px-3 font-display text-[12px] font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          <i className="ti ti-send text-[14px]" aria-hidden />
          계약서 발송
        </button>
      ) : isSent ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => send(contract.id, true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-iris/30 bg-iris/10 px-3 font-display text-[12px] font-bold text-iris hover:bg-iris/15 disabled:opacity-50"
        >
          <i className="ti ti-send text-[14px]" aria-hidden />
          재발송
        </button>
      ) : null}
    </>
  );
}
