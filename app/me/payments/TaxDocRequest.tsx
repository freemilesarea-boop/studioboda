"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestTaxDocumentAction } from "@/lib/actions/payments";
import { useToast } from "@/components/admin/Toast";
import type { AccountType } from "@/lib/types/db";

type TaxDoc = {
  type: "tax_invoice" | "cash_receipt";
  status: "requested" | "issued";
} | null;

const DOC_LABEL: Record<"tax_invoice" | "cash_receipt", string> = {
  tax_invoice: "세금계산서",
  cash_receipt: "현금영수증",
};

export function TaxDocRequest({
  paymentId,
  accountType,
  taxDoc,
}: {
  paymentId: string;
  accountType: AccountType;
  taxDoc: TaxDoc;
}) {
  const defaultType =
    accountType === "business" ? "tax_invoice" : "cash_receipt";
  const [docType, setDocType] =
    useState<"tax_invoice" | "cash_receipt">(defaultType);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  // Already requested / issued — show status only.
  if (taxDoc) {
    return (
      <p className="text-[11px] text-ink-50">
        {DOC_LABEL[taxDoc.type]}{" "}
        {taxDoc.status === "issued" ? (
          <span className="font-bold text-success">발행 완료</span>
        ) : (
          <span className="font-bold text-iris">발행 요청됨</span>
        )}
      </p>
    );
  }

  function submit() {
    const fd = new FormData();
    fd.set("payment_id", paymentId);
    fd.set("doc_type", docType);
    startTransition(async () => {
      const r = await requestTaxDocumentAction(fd);
      if (r.ok) {
        push("증빙 발행을 요청했습니다. 운영팀이 확인 후 발행합니다.");
        router.refresh();
      } else {
        push(r.error ?? "요청 실패", "error");
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={docType}
        onChange={(e) =>
          setDocType(e.target.value as "tax_invoice" | "cash_receipt")
        }
        disabled={pending}
        aria-label="증빙 종류"
        className="rounded-lg border border-ink-15 bg-white px-2 py-1 text-[11px] text-ink-70 outline-none focus:border-iris/60"
      >
        <option value="tax_invoice">세금계산서</option>
        <option value="cash_receipt">현금영수증</option>
      </select>
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="inline-flex items-center rounded-lg border border-ink-15 px-2.5 py-1 font-display text-[11px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100 disabled:opacity-60"
      >
        증빙 요청
      </button>
    </div>
  );
}
