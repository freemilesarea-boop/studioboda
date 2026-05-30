"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContractFromQuoteAction } from "@/lib/actions/contracts";
import { useToast } from "@/components/admin/Toast";

export function QuoteContractButton({
  quoteId,
  existingContractId,
}: {
  quoteId: string;
  existingContractId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  if (existingContractId) {
    return (
      <Link
        href={`/admin/contracts/${existingContractId}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-15 bg-white px-3 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
      >
        <i className="ti ti-file-text text-[14px]" aria-hidden />
        계약서 보기
      </Link>
    );
  }

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
