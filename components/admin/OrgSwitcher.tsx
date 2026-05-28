"use client";

import { useState } from "react";
import type { Organization } from "@/lib/types/db";

export function OrgSwitcher({
  orgs,
  currentSlug = "boda",
}: {
  orgs: Pick<Organization, "id" | "slug" | "name" | "display_name" | "brand_color" | "active">[];
  currentSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const current =
    orgs.find((o) => o.slug === currentSlug) ?? orgs[0] ?? null;

  if (!current) return null;
  const label = current.display_name ?? current.name;
  const dot = current.brand_color ?? "#6366f1";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink-15 bg-white px-2.5 font-display text-[12px] font-semibold text-ink-100 hover:border-ink-30"
      >
        <span
          className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold text-white"
          style={{ backgroundColor: dot }}
        >
          {label.slice(0, 1)}
        </span>
        <span className="hidden sm:inline">{label}</span>
        <i className="ti ti-chevron-down text-[12px] text-ink-50" aria-hidden />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-ink-15 bg-white p-1.5 shadow-[0_12px_32px_-16px_rgba(10,10,18,0.25)]">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
            조직 전환
          </p>
          <ul>
            {orgs.map((o) => {
              const isCurrent = o.slug === current.slug;
              const isActive = o.active;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    disabled={!isActive || isCurrent}
                    onClick={() => setOpen(false)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] ${
                      isCurrent
                        ? "bg-ink-100/[0.04] font-bold text-ink-100"
                        : isActive
                        ? "text-ink-70 hover:bg-ink-100/[0.04]"
                        : "cursor-not-allowed text-ink-30"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: o.brand_color ?? "#6366f1",
                        opacity: isActive ? 1 : 0.4,
                      }}
                    />
                    <span className="flex-1 truncate">
                      {o.display_name ?? o.name}
                    </span>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-iris">현재</span>
                    ) : !isActive ? (
                      <span className="text-[10px] text-ink-50">준비 중</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-ink-15 px-2 pt-2 pb-1 text-[10.5px] text-ink-50">
            현재는 STUDIO BODA 운영만 활성. 다른 브랜드는 후속 단계에서 연결됩니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
