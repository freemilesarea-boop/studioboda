"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveBrandForUserAction,
  saveMyBrandAction,
} from "@/lib/actions/brand";
import { useToast } from "@/components/admin/Toast";
import type { BrandProfile } from "@/lib/types/db";

export function BrandForm({
  initial,
  ownerMode,
  userId,
}: {
  initial: BrandProfile | null;
  ownerMode?: boolean;
  userId?: string;
}) {
  const [brandName, setBrandName] = useState(initial?.brand_name ?? "");
  const [brandColors, setBrandColors] = useState(initial?.brand_colors ?? "");
  const [refSites, setRefSites] = useState(initial?.reference_sites ?? "");
  const [tone, setTone] = useState(initial?.tone ?? "");
  const [forbidden, setForbidden] = useState(
    initial?.forbidden_expressions ?? "",
  );
  const [goTo, setGoTo] = useState(initial?.go_to_phrases ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const input = {
        brand_name: brandName,
        brand_colors: brandColors,
        reference_sites: refSites,
        tone,
        forbidden_expressions: forbidden,
        go_to_phrases: goTo,
        notes,
      };
      const r = ownerMode
        ? await saveMyBrandAction(input)
        : await saveBrandForUserAction(userId!, input);
      if (r.ok) {
        push("저장되었습니다");
        router.refresh();
      } else {
        push(r.error ?? "저장 실패", "error");
      }
    });
  }

  const cls =
    "h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60";
  const txt =
    "w-full resize-y rounded-md border border-ink-15 bg-white px-3 py-2 text-[13px] leading-body outline-none focus:border-iris/60";
  const label =
    "mb-1 block font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={label}>브랜드 이름</span>
          <input
            className={cls}
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            maxLength={120}
            placeholder="예: STUDIO BODA"
          />
        </label>
        <label className="block">
          <span className={label}>브랜드 컬러</span>
          <input
            className={cls}
            value={brandColors}
            onChange={(e) => setBrandColors(e.target.value)}
            maxLength={200}
            placeholder="예: #5B47FF, #0A0A12, off-white"
          />
        </label>
      </div>

      <label className="block">
        <span className={label}>참고 사이트 / 레퍼런스</span>
        <textarea
          rows={2}
          className={txt}
          value={refSites}
          onChange={(e) => setRefSites(e.target.value)}
          placeholder="예: linear.app, stripe.com, attn-grace.com"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={label}>톤앤매너</span>
          <textarea
            rows={3}
            className={txt}
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="예: 미니멀, 프리미엄, 차분한 신뢰감"
          />
        </label>
        <label className="block">
          <span className={label}>금지 표현</span>
          <textarea
            rows={3}
            className={txt}
            value={forbidden}
            onChange={(e) => setForbidden(e.target.value)}
            placeholder="예: 자극적 단어, 절대 보장, 신적 비유"
          />
        </label>
      </div>

      <label className="block">
        <span className={label}>자주 쓰는 문구 / 핵심 카피</span>
        <textarea
          rows={2}
          className={txt}
          value={goTo}
          onChange={(e) => setGoTo(e.target.value)}
          placeholder="예: '한 번 더 보다', '내일 쓸 콘텐츠'"
        />
      </label>

      <label className="block">
        <span className={label}>기타 메모</span>
        <textarea
          rows={3}
          className={txt}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="추가로 운영팀이 알아야 할 사항"
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-lg bg-iris px-5 font-display text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
