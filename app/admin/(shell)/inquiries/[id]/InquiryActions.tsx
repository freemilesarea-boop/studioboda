"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInquiryStatusAction } from "@/lib/actions/inquiries";
import { createQuoteAction } from "@/lib/actions/quotes";
import { inquiryStatusLabels } from "@/lib/types/db";
import type { InquiryStatus } from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";

const STATUSES: InquiryStatus[] = [
  "new",
  "contacted",
  "quoted",
  "converted",
  "archived",
];

export function InquiryActions({
  id,
  currentStatus,
  defaultQuote,
}: {
  id: string;
  currentStatus: InquiryStatus;
  defaultQuote: { title: string; service_type: string | null };
}) {
  const [pending, startTransition] = useTransition();
  const [creating, startCreate] = useTransition();
  const [basePrice, setBasePrice] = useState(99000);
  const [days, setDays] = useState(5);
  const { push } = useToast();
  const router = useRouter();

  function changeStatus(status: InquiryStatus) {
    if (status === currentStatus) return;
    startTransition(async () => {
      const r = await updateInquiryStatusAction(id, status);
      if (r.ok) {
        push("상태가 변경되었습니다");
        router.refresh();
      } else {
        push(r.error ?? "변경 실패", "error");
      }
    });
  }

  function createQuote() {
    startCreate(async () => {
      const r = await createQuoteAction({
        inquiry_id: id,
        title: defaultQuote.title,
        service_type: defaultQuote.service_type,
        base_price: basePrice,
        options: [],
        delivery_days: days,
        status: "draft",
      });
      if (r.ok && r.id) {
        push("견적이 생성되었습니다");
        router.push(`/admin/quotes/${r.id}`);
      } else {
        push((r as { error?: string }).error ?? "생성 실패", "error");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
          상태 변경
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending || s === currentStatus}
              onClick={() => changeStatus(s)}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                s === currentStatus
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30 disabled:opacity-50"
              }`}
            >
              {inquiryStatusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
          빠른 견적 생성
        </p>
        <label className="block">
          <span className="block text-[11px] text-ink-50">기본 금액 (KRW)</span>
          <input
            type="number"
            value={basePrice}
            min={0}
            onChange={(e) => setBasePrice(Number(e.target.value))}
            className="mt-1 h-9 w-full rounded-md border border-ink-15 bg-white px-2.5 text-[13px] text-ink-100 outline-none focus:border-iris/60"
          />
        </label>
        <label className="block">
          <span className="block text-[11px] text-ink-50">납기 (일)</span>
          <input
            type="number"
            value={days}
            min={1}
            max={120}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 h-9 w-full rounded-md border border-ink-15 bg-white px-2.5 text-[13px] text-ink-100 outline-none focus:border-iris/60"
          />
        </label>
        <button
          type="button"
          disabled={creating}
          onClick={createQuote}
          className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg bg-iris text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {creating ? "생성 중…" : "견적 생성"}
        </button>
      </div>
    </div>
  );
}
