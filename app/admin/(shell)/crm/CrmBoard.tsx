"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { moveLeadAction } from "@/lib/actions/crm";
import { useToast } from "@/components/admin/Toast";
import { LEAD_PIPELINE, leadStatusLabels, type LeadStatus } from "@/lib/types/db";
import type { LeadCard } from "@/lib/queries/crm";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export function CrmBoard({ initial }: { initial: LeadCard[] }) {
  const [cards, setCards] = useState<LeadCard[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<LeadStatus | null>(null);
  const [, startTransition] = useTransition();
  const { push } = useToast();

  const byStatus = useMemo(() => {
    const map: Record<string, LeadCard[]> = {};
    for (const s of LEAD_PIPELINE) map[s] = [];
    for (const c of cards) (map[c.lead_status] ?? (map[c.lead_status] = [])).push(c);
    return map;
  }, [cards]);

  function onDrop(status: LeadStatus) {
    setOverCol(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.lead_status === status) return;

    const prev = cards;
    // Optimistic move
    setCards((cs) =>
      cs.map((c) => (c.id === id ? { ...c, lead_status: status } : c)),
    );
    startTransition(async () => {
      const r = await moveLeadAction(id, status);
      if (!r.ok) {
        setCards(prev);
        push(r.error ?? "이동 실패", "error");
      }
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {LEAD_PIPELINE.map((status) => {
        const list = byStatus[status] ?? [];
        const sum = list.reduce((a, c) => a + (c.estimated_amount ?? 0), 0);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              if (overCol !== status) setOverCol(status);
            }}
            onDrop={() => onDrop(status)}
            className={`flex w-[230px] shrink-0 flex-col rounded-2xl border p-2.5 ${
              overCol === status
                ? "border-iris bg-iris/[0.04]"
                : "border-ink-15 bg-ink-5"
            }`}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="font-display text-[12px] font-bold text-ink-100">
                {leadStatusLabels[status]}
                <span className="num ml-1.5 text-[11px] font-bold text-ink-50">
                  {list.length}
                </span>
              </span>
            </div>
            {sum > 0 ? (
              <p className="num px-1 pb-2 text-[10px] text-ink-50">
                예상 {fmt(sum)}원
              </p>
            ) : null}

            <div className="flex flex-1 flex-col gap-2">
              {list.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  className={`cursor-grab rounded-xl border border-ink-15 bg-white p-3 active:cursor-grabbing ${
                    dragId === c.id ? "opacity-50" : ""
                  }`}
                >
                  <p className="font-display text-[12.5px] font-bold text-ink-100">
                    {c.company || c.name || "익명"}
                  </p>
                  {c.company && c.name ? (
                    <p className="text-[11px] text-ink-50">{c.name}</p>
                  ) : null}
                  {c.service_type ? (
                    <p className="mt-1 text-[11px] text-ink-70">{c.service_type}</p>
                  ) : null}
                  {c.estimated_amount ? (
                    <p className="num mt-1 text-[11px] font-bold text-iris">
                      {fmt(c.estimated_amount)}원
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between">
                    <Link
                      href={`/admin/inquiries/${c.id}`}
                      className="text-[10.5px] text-iris hover:underline"
                    >
                      상세 →
                    </Link>
                    <span className="text-[10px] text-ink-30">
                      {c.last_activity_at
                        ? new Date(c.last_activity_at).toLocaleDateString("ko-KR", {
                            month: "numeric",
                            day: "numeric",
                          })
                        : new Date(c.created_at).toLocaleDateString("ko-KR", {
                            month: "numeric",
                            day: "numeric",
                          })}
                    </span>
                  </div>
                </div>
              ))}
              {list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-15 py-6 text-center text-[10.5px] text-ink-30">
                  비어 있음
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
