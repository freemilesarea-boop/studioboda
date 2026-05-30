"use client";

import { useMemo, useState } from "react";
import { type FaqCategory, type FaqItem } from "@/lib/types/db";

const ALL = "__all__";

export function FaqBrowser({
  categories,
  items,
}: {
  categories: FaqCategory[];
  items: FaqItem[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [openId, setOpenId] = useState<string | null>(null);

  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory !== ALL && item.category_id !== activeCategory) {
        return false;
      }
      if (!normalized) return true;
      return (
        item.question.toLowerCase().includes(normalized) ||
        item.answer.toLowerCase().includes(normalized)
      );
    });
  }, [items, activeCategory, normalized]);

  const grouped = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        rows: filtered.filter((item) => item.category_id === category.id),
      }))
      .filter((group) => group.rows.length > 0);
  }, [categories, filtered]);

  const uncategorized = useMemo(
    () => filtered.filter((item) => item.category_id == null),
    [filtered],
  );

  const hasResults = grouped.length > 0 || uncategorized.length > 0;

  return (
    <div>
      <div className="flex flex-col gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="궁금한 점을 검색해보세요"
          className="w-full rounded-xl border border-ink-15 bg-white px-4 py-3 text-[15px] text-ink-100 outline-none transition focus:border-iris focus:ring-2 focus:ring-iris/15"
        />

        <div className="flex flex-wrap gap-2">
          <Chip
            label="전체"
            active={activeCategory === ALL}
            onClick={() => setActiveCategory(ALL)}
          />
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-10">
        {!hasResults && (
          <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-6 py-12 text-center text-[14px] text-ink-50">
            검색 결과가 없습니다
          </div>
        )}

        {grouped.map(({ category, rows }) => (
          <div key={category.id}>
            <h2 className="font-display text-[18px] font-bold tracking-display text-ink-100">
              {category.name}
            </h2>
            <div className="mt-4 space-y-3">
              {rows.map((item) => (
                <Accordion
                  key={item.id}
                  item={item}
                  open={openId === item.id}
                  onToggle={() =>
                    setOpenId((prev) => (prev === item.id ? null : item.id))
                  }
                />
              ))}
            </div>
          </div>
        ))}

        {uncategorized.length > 0 && (
          <div>
            <h2 className="font-display text-[18px] font-bold tracking-display text-ink-100">
              기타
            </h2>
            <div className="mt-4 space-y-3">
              {uncategorized.map((item) => (
                <Accordion
                  key={item.id}
                  item={item}
                  open={openId === item.id}
                  onToggle={() =>
                    setOpenId((prev) => (prev === item.id ? null : item.id))
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 font-display text-[12.5px] font-bold transition ${
        active
          ? "border-ink-100 bg-ink-100 text-white"
          : "border-ink-15 bg-white text-ink-50 hover:border-ink-100 hover:text-ink-100"
      }`}
    >
      {label}
    </button>
  );
}

function Accordion({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-15 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-[15px] font-semibold text-ink-100">
          {item.question}
        </span>
        <span
          className={`shrink-0 text-ink-50 transition-transform ${
            open ? "rotate-45" : ""
          }`}
          aria-hidden
        >
          +
        </span>
      </button>
      {open && (
        <div className="border-t border-ink-15 px-5 py-4 text-[14px] leading-relaxed text-ink-50 whitespace-pre-wrap">
          {item.answer}
        </div>
      )}
    </div>
  );
}
