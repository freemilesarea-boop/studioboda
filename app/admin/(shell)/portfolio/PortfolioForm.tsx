"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import {
  createPortfolioItemAction,
  updatePortfolioItemAction,
} from "@/lib/actions/portfolio";
import type {
  PortfolioItem,
  PortfolioMetrics,
  PortfolioStatus,
} from "@/lib/types/db";
import { portfolioStatusLabels } from "@/lib/types/db";

const STATUSES: PortfolioStatus[] = ["draft", "published", "archived"];

function metricsToText(m: PortfolioMetrics): string {
  return Object.entries(m)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export function PortfolioForm({ item }: { item?: PortfolioItem }) {
  const isEdit = !!item;
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<PortfolioStatus>(item?.status ?? "draft");
  const [isFeatured, setIsFeatured] = useState(item?.is_featured ?? false);
  const { push } = useToast();
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("status", status);
    fd.set("is_featured", isFeatured ? "on" : "");

    startTransition(async () => {
      if (isEdit && item) {
        const r = await updatePortfolioItemAction(item.id, fd);
        if (r.ok) {
          push("저장되었습니다");
          router.refresh();
        } else {
          push(r.error ?? "저장 실패", "error");
        }
      } else {
        const r = await createPortfolioItemAction(fd);
        if (r.ok) {
          push("생성되었습니다");
          router.push(`/admin/portfolio/${r.id}`);
        } else {
          push(r.error ?? "생성 실패", "error");
        }
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="제목 *">
          <input
            name="title"
            required
            defaultValue={item?.title ?? ""}
            placeholder="예: 비건 스킨케어 세럼 런칭 페이지"
            className={inputCls}
          />
        </Field>
        <Field
          label="slug"
          hint="비워두면 제목으로 자동 생성합니다. 영문/숫자/한글/-만 사용."
        >
          <input
            name="slug"
            defaultValue={item?.slug ?? ""}
            placeholder="auto"
            className={inputCls}
          />
        </Field>
        <Field label="브랜드명">
          <input
            name="brand_name"
            defaultValue={item?.brand_name ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="고객명">
          <input
            name="client_name"
            defaultValue={item?.client_name ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="서비스 타입" hint="상세페이지 / 광고 배너 / SNS 등">
          <input
            name="service_type"
            defaultValue={item?.service_type ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="카테고리" hint="Beauty / Fashion / F&B 등 산업">
          <input
            name="category"
            defaultValue={item?.category ?? ""}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="설명" hint="카드 서브카피로 사용됩니다 (1-2 문장)">
        <textarea
          name="description"
          rows={2}
          defaultValue={item?.description ?? ""}
          className={textareaCls}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Field label="문제 (Problem)">
          <textarea
            name="problem"
            rows={5}
            defaultValue={item?.problem ?? ""}
            className={textareaCls}
          />
        </Field>
        <Field label="해결 (Solution)">
          <textarea
            name="solution"
            rows={5}
            defaultValue={item?.solution ?? ""}
            className={textareaCls}
          />
        </Field>
        <Field label="결과 요약 (Result)">
          <textarea
            name="result_summary"
            rows={5}
            defaultValue={item?.result_summary ?? ""}
            className={textareaCls}
          />
        </Field>
      </div>

      <Field
        label="성과 수치 (metrics)"
        hint='한 줄에 "label=value" 형식 또는 JSON. 예: CTR=+38%, ROAS=420%'
      >
        <textarea
          name="metrics"
          rows={4}
          defaultValue={item ? metricsToText(item.metrics) : ""}
          placeholder="CTR=+38%\nROAS=420%\n납기=24h"
          className={`${textareaCls} font-mono text-[12.5px]`}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="공개 상태">
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                  status === s
                    ? "border-ink-100 bg-ink-100 text-white"
                    : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
                }`}
              >
                {portfolioStatusLabels[s]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Featured" hint="랜딩 Selected works 노출 여부">
          <label className="inline-flex items-center gap-2 text-[13px] text-ink-100">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 accent-iris"
            />
            랜딩 상단 카드로 노출
          </label>
        </Field>
        <Field label="정렬 순서 (작을수록 위)">
          <input
            name="sort_order"
            type="number"
            step={1}
            defaultValue={item?.sort_order ?? 0}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-ink-15 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink-100 px-5 font-display text-[13px] font-bold text-white hover:bg-ink-90 disabled:opacity-60"
        >
          {pending ? "저장 중…" : isEdit ? "저장" : "생성"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60";
const textareaCls =
  "w-full resize-y rounded-md border border-ink-15 bg-white px-3 py-2 text-[13px] leading-[1.65] outline-none focus:border-iris/60";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-ink-50">{hint}</span> : null}
    </label>
  );
}
