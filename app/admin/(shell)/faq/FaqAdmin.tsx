"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/Toast";
import {
  upsertFaqItemAction,
  deleteFaqItemAction,
  upsertFaqCategoryAction,
} from "@/lib/actions/faq";
import { type FaqCategory, type FaqItem } from "@/lib/types/db";

const inputClass =
  "rounded-lg border border-ink-15 px-3 py-2 text-[13px] outline-none focus:border-ink-100";
const primaryButtonClass =
  "bg-ink-100 text-white rounded-lg px-3 py-1.5 font-display text-[12px] font-bold disabled:opacity-50";

export function FaqAdmin({ categories }: { categories: FaqCategory[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();

  function handleItemSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const res = await upsertFaqItemAction(formData);
      if (res.ok) {
        push("저장되었습니다");
        form.reset();
        router.refresh();
      } else {
        push(res.error, "error");
      }
    });
  }

  function handleCategorySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const res = await upsertFaqCategoryAction(formData);
      if (res.ok) {
        push("저장되었습니다");
        form.reset();
        router.refresh();
      } else {
        push(res.error, "error");
      }
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[15px] font-bold text-ink-100">
          FAQ 항목 추가
        </h2>
        <form onSubmit={handleItemSubmit} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-ink-50">질문</label>
            <textarea
              name="question"
              required
              rows={2}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-ink-50">답변</label>
            <textarea name="answer" required rows={4} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-ink-50">
                카테고리
              </label>
              <select name="category_id" className={inputClass} defaultValue="">
                <option value="">미분류</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-ink-50">
                정렬 순서
              </label>
              <input
                type="number"
                name="sort_order"
                defaultValue={0}
                className={inputClass}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink-100">
            <input type="checkbox" name="active" defaultChecked /> 활성화
          </label>
          <div>
            <button type="submit" disabled={pending} className={primaryButtonClass}>
              {pending ? "저장 중…" : "추가"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[15px] font-bold text-ink-100">
          카테고리 추가
        </h2>
        <form
          onSubmit={handleCategorySubmit}
          className="mt-4 flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-ink-50">이름</label>
            <input name="name" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-ink-50">
              정렬 순서
            </label>
            <input
              type="number"
              name="sort_order"
              defaultValue={0}
              className={inputClass}
            />
          </div>
          <div>
            <button type="submit" disabled={pending} className={primaryButtonClass}>
              {pending ? "저장 중…" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FaqItemRow({
  item,
  categories,
}: {
  item: FaqItem;
  categories: FaqCategory[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  function handleDelete() {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const res = await deleteFaqItemAction(item.id);
      if (res.ok) {
        push("저장되었습니다");
        router.refresh();
      } else {
        push(res.error, "error");
      }
    });
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertFaqItemAction(formData);
      if (res.ok) {
        push("저장되었습니다");
        setEditing(false);
        router.refresh();
      } else {
        push(res.error, "error");
      }
    });
  }

  if (editing) {
    return (
      <form
        onSubmit={handleEditSubmit}
        className="rounded-lg border border-ink-15 p-3"
      >
        <input type="hidden" name="id" value={item.id} />
        <div className="flex flex-col gap-2">
          <textarea
            name="question"
            required
            rows={2}
            defaultValue={item.question}
            className={inputClass}
          />
          <textarea
            name="answer"
            required
            rows={3}
            defaultValue={item.answer}
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              name="category_id"
              defaultValue={item.category_id ?? ""}
              className={inputClass}
            >
              <option value="">미분류</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="sort_order"
              defaultValue={item.sort_order}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink-100">
            <input
              type="checkbox"
              name="active"
              defaultChecked={item.active}
            />{" "}
            활성화
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className={primaryButtonClass}
            >
              {pending ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-ink-15 px-3 py-1.5 font-display text-[12px] font-bold text-ink-50"
            >
              취소
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-15 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink-100">
          {item.question}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-50">순서 {item.sort_order}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          item.active
            ? "bg-success/10 text-success"
            : "bg-ink-15 text-ink-50"
        }`}
      >
        {item.active ? "활성" : "비활성"}
      </span>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-ink-15 px-2.5 py-1 font-display text-[12px] font-bold text-ink-100"
        >
          편집
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-lg border border-error/30 px-2.5 py-1 font-display text-[12px] font-bold text-error disabled:opacity-50"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
