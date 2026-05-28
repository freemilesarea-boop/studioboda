"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { setQuoteStatusAction, updateQuoteAction } from "@/lib/actions/quotes";
import type { QuoteOption, QuoteStatus } from "@/lib/types/db";
import { useToast } from "@/components/admin/Toast";
import { AdminCard } from "@/components/admin/Card";

type Quote = {
  id: string;
  inquiry_id: string | null;
  title: string;
  service_type: string | null;
  base_price: number;
  options: QuoteOption[];
  delivery_days: number;
  status: QuoteStatus;
  expires_at: string | null;
  total_price: number;
};

const ACTION_STATUSES: { value: QuoteStatus; label: string }[] = [
  { value: "draft", label: "초안" },
  { value: "sent", label: "발송" },
  { value: "accepted", label: "수락 (프로젝트 생성)" },
  { value: "rejected", label: "거절" },
  { value: "expired", label: "만료" },
];

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export function QuoteEditor({ quote }: { quote: Quote }) {
  const [title, setTitle] = useState(quote.title);
  const [serviceType, setServiceType] = useState(quote.service_type ?? "");
  const [basePrice, setBasePrice] = useState(quote.base_price);
  const [days, setDays] = useState(quote.delivery_days);
  const [options, setOptions] = useState<QuoteOption[]>(quote.options ?? []);
  const [expiresAt, setExpiresAt] = useState(
    quote.expires_at ? quote.expires_at.slice(0, 10) : "",
  );
  const [saving, startSave] = useTransition();
  const [transitioning, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  const total = useMemo(
    () => options.reduce((s, o) => s + (o.price || 0), basePrice),
    [basePrice, options],
  );

  function save() {
    startSave(async () => {
      const r = await updateQuoteAction(quote.id, {
        inquiry_id: quote.inquiry_id,
        title,
        service_type: serviceType || null,
        base_price: basePrice,
        options,
        delivery_days: days,
        status: quote.status,
        expires_at: expiresAt
          ? new Date(expiresAt + "T23:59:59Z").toISOString()
          : null,
      });
      if (r.ok) {
        push("저장되었습니다");
        router.refresh();
      } else {
        push((r as { error?: string }).error ?? "저장 실패", "error");
      }
    });
  }

  function changeStatus(next: QuoteStatus) {
    if (next === quote.status) return;
    if (next === "accepted") {
      const confirmed = window.confirm(
        "이 견적을 수락 처리하면 프로젝트가 자동 생성됩니다. 진행할까요?",
      );
      if (!confirmed) return;
    }
    startTransition(async () => {
      const r = await setQuoteStatusAction(quote.id, next);
      if (r.ok) {
        push(`상태: ${next}`);
        router.refresh();
      } else {
        push((r as { error?: string }).error ?? "변경 실패", "error");
      }
    });
  }

  function addOption() {
    setOptions((arr) => [...arr, { key: `opt-${arr.length + 1}`, label: "", price: 0 }]);
  }
  function removeOption(idx: number) {
    setOptions((arr) => arr.filter((_, i) => i !== idx));
  }
  function patchOption(idx: number, patch: Partial<QuoteOption>) {
    setOptions((arr) => arr.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <AdminCard title="기본 정보" className="lg:col-span-2">
        <div className="space-y-3">
          <Field label="제목">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="서비스 유형">
              <input
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="예: 상세페이지"
                className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60"
              />
            </Field>
            <Field label="만료일">
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="기본 금액 (KRW)">
              <input
                type="number"
                min={0}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60"
              />
            </Field>
            <Field label="납기 (일)">
              <input
                type="number"
                min={1}
                max={120}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
              옵션
            </p>
            <button
              type="button"
              onClick={addOption}
              className="rounded-md border border-ink-15 px-2.5 py-1 text-[11px] font-bold text-ink-70 hover:border-ink-30"
            >
              + 옵션 추가
            </button>
          </div>
          {options.length === 0 ? (
            <p className="text-[12px] text-ink-50">옵션 없음</p>
          ) : (
            <ul className="space-y-2">
              {options.map((o, idx) => (
                <li
                  key={idx}
                  className="grid grid-cols-12 items-center gap-2 rounded-md border border-ink-15 px-2.5 py-2"
                >
                  <input
                    value={o.label}
                    onChange={(e) => patchOption(idx, { label: e.target.value })}
                    placeholder="옵션명"
                    className="col-span-7 h-8 rounded-md border border-ink-15 bg-white px-2 text-[12.5px] outline-none focus:border-iris/60"
                  />
                  <input
                    type="number"
                    min={0}
                    value={o.price}
                    onChange={(e) =>
                      patchOption(idx, { price: Number(e.target.value) })
                    }
                    className="num col-span-3 h-8 rounded-md border border-ink-15 bg-white px-2 text-right text-[12.5px] outline-none focus:border-iris/60"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="col-span-2 h-8 rounded-md border border-ink-15 text-[11px] text-ink-50 hover:border-error/60 hover:text-error"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-ink-15 pt-4">
          <p className="text-[11px] text-ink-50">합계</p>
          <p className="num font-display text-[20px] font-extrabold tracking-[-0.4px] text-ink-100">
            {fmt(total)}원
          </p>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="h-10 rounded-lg bg-ink-100 px-4 font-display text-[12.5px] font-bold text-white hover:bg-ink-90 disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </AdminCard>

      <AdminCard title="상태 변경">
        <div className="flex flex-col gap-1.5">
          {ACTION_STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              disabled={transitioning || s.value === quote.status}
              onClick={() => changeStatus(s.value)}
              className={`rounded-lg border px-3 py-2 text-left text-[12.5px] font-semibold transition-colors ${
                s.value === quote.status
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30 disabled:opacity-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </span>
      {children}
    </label>
  );
}
