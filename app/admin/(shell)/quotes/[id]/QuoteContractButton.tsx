"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendQuotePackageAction } from "@/lib/actions/contracts";
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

  // 견적·계약·예약금 통합 발송 (single button). Creates the contract if missing,
  // ensures the deposit charge, sends the contract, and emails the combined
  // 견적서·계약서·예약금 package to the customer + all staff. Idempotent.
  function sendPackage() {
    const ok = window.confirm(
      contract
        ? "견적서·계약서·예약금 결제 링크를 고객에게 (재)발송합니다. 진행할까요?"
        : "계약서를 생성하고 견적서·계약서·예약금 결제 링크를 고객에게 발송합니다. 진행할까요?",
    );
    if (!ok) return;
    startTransition(async () => {
      const r = await sendQuotePackageAction(quoteId);
      if (r.ok) {
        push(
          r.resent
            ? "통합 안내 메일을 재발송했습니다 (견적서·계약서·예약금)"
            : "견적·계약·예약금을 통합 발송했습니다 (고객 + 관리자 전원 메일)",
        );
        router.refresh();
      } else {
        push(r.error ?? "발송 실패", "error");
      }
    });
  }

  const sendLabel = !contract
    ? "견적·계약·예약금 통합 발송"
    : contract.status === "draft"
      ? "견적·계약·예약금 통합 발송"
      : "통합 안내 재발송";

  return (
    <>
      {/* 미리보기 / 상세 (계약서가 있을 때만) */}
      {contract ? (
        <>
          <Link
            href={`/admin/print/contract/${contract.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            <i className="ti ti-eye text-[14px]" aria-hidden />
            계약서 미리보기
          </Link>
          <Link href={`/admin/contracts/${contract.id}`} className={linkCls}>
            <i className="ti ti-file-text text-[14px]" aria-hidden />
            계약서 보기
          </Link>
        </>
      ) : null}

      {/* 통합 발송 (주 버튼) — 취소/만료 상태가 아니면 노출 */}
      {!contract || !["cancelled", "expired"].includes(contract.status) ? (
        <button
          type="button"
          disabled={pending}
          onClick={sendPackage}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-iris px-3 font-display text-[12px] font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          <i className="ti ti-send text-[14px]" aria-hidden />
          {sendLabel}
        </button>
      ) : null}
    </>
  );
}
