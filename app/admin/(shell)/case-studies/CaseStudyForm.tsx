"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";
import {
  createCaseStudyAction,
  updateCaseStudyAction,
  deleteCaseStudyAction,
} from "@/lib/actions/case-studies";
import type { CaseStudy, CaseStudyMetric } from "@/lib/types/db";

type Status = "draft" | "published" | "archived";

const STATUSES: { value: Status; label: string }[] = [
  { value: "draft", label: "초안" },
  { value: "published", label: "공개" },
  { value: "archived", label: "보관" },
];

function metricsToText(metrics: CaseStudyMetric[]): string {
  return metrics
    .map((m) => (m.delta ? `${m.label}=${m.value}=${m.delta}` : `${m.label}=${m.value}`))
    .join("\n");
}

export function CaseStudyForm({ initial }: { initial?: CaseStudy }) {
  const isEdit = !!initial;
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(initial?.status ?? "draft");
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const { push } = useToast();
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("status", status);
    fd.set("is_featured", isFeatured ? "on" : "");

    startTransition(async () => {
      if (isEdit && initial) {
        const r = await updateCaseStudyAction(initial.id, fd);
        if (r.ok) {
          push("저장되었습니다");
          router.refresh();
        } else {
          push(r.error ?? "저장 실패", "error");
        }
      } else {
        const r = await createCaseStudyAction(fd);
        if (r.ok) {
          push("생성되었습니다");
          router.push("/admin/case-studies");
        } else {
          push(r.error ?? "생성 실패", "error");
        }
      }
    });
  }

  function remove() {
    if (!initial) return;
    if (!window.confirm("이 성공사례를 삭제(보관)하시겠습니까?")) return;
    startTransition(async () => {
      const r = await deleteCaseStudyAction(initial.id);
      if (r.ok) {
        push("삭제되었습니다");
        router.push("/admin/case-studies");
      } else {
        push(r.error ?? "삭제 실패", "error");
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
            defaultValue={initial?.title ?? ""}
            placeholder="예: 비건 스킨케어 매출 3배 성장 사례"
            className={inputCls}
          />
        </Field>
        <Field label="slug" hint="비워두면 제목으로 자동 생성합니다.">
          <input
            name="slug"
            defaultValue={initial?.slug ?? ""}
            placeholder="auto"
            className={inputCls}
          />
        </Field>
        <Field label="서브타이틀">
          <input
            name="subtitle"
            defaultValue={initial?.subtitle ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="고객명">
          <input
            name="client_name"
            defaultValue={initial?.client_name ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="서비스 타입" hint="상세페이지 / 브랜딩 / 광고 등">
          <input
            name="service_type"
            defaultValue={initial?.service_type ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="카테고리" hint="Beauty / Fashion / F&B 등 산업">
          <input
            name="category"
            defaultValue={initial?.category ?? ""}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="요약 (개요)" hint="목록 카드와 상세 상단에 노출됩니다.">
        <textarea
          name="summary"
          rows={2}
          defaultValue={initial?.summary ?? ""}
          className={textareaCls}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Field label="문제점 (Problem)">
          <textarea
            name="problem"
            rows={5}
            defaultValue={initial?.problem ?? ""}
            className={textareaCls}
          />
        </Field>
        <Field label="해결 방법 (Solution)">
          <textarea
            name="solution"
            rows={5}
            defaultValue={initial?.solution ?? ""}
            className={textareaCls}
          />
        </Field>
        <Field label="결과 (Result)">
          <textarea
            name="result_summary"
            rows={5}
            defaultValue={initial?.result_summary ?? ""}
            className={textareaCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="사용 기술 (tech stack)" hint="쉼표로 구분. 예: Next.js, Figma, GA4">
          <input
            name="tech_stack"
            defaultValue={initial ? initial.tech_stack.join(", ") : ""}
            placeholder="Next.js, Figma, GA4"
            className={inputCls}
          />
        </Field>
        <Field label="성과 수치 (metrics)" hint='한 줄에 하나 · "라벨=값=증감"'>
          <textarea
            name="metrics"
            rows={4}
            defaultValue={initial ? metricsToText(initial.metrics) : ""}
            placeholder="매출 증가=+182%=전월 대비 (한 줄에 하나)"
            className={`${textareaCls} font-mono text-[12.5px]`}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="썸네일 URL">
          <input
            name="thumbnail_url"
            defaultValue={initial?.thumbnail_url ?? ""}
            placeholder="https://…"
            className={inputCls}
          />
        </Field>
        <Field label="커버 URL">
          <input
            name="cover_url"
            defaultValue={initial?.cover_url ?? ""}
            placeholder="https://…"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="공개 상태">
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                  status === s.value
                    ? "border-ink-100 bg-ink-100 text-white"
                    : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Featured" hint="목록 상단 추천 사례로 노출">
          <label className="inline-flex items-center gap-2 text-[13px] text-ink-100">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 accent-iris"
            />
            추천 사례로 노출
          </label>
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-ink-15 pt-4">
        {isEdit ? (
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            className="mr-auto inline-flex h-10 items-center gap-1 rounded-lg border border-error/30 bg-error/[0.06] px-4 font-display text-[13px] font-bold text-error hover:bg-error/[0.12] disabled:opacity-50"
          >
            삭제
          </button>
        ) : null}
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
