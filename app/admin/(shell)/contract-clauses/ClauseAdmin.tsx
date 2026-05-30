"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertClauseBlockAction,
  deleteClauseBlockAction,
  disableBuiltinBlockAction,
} from "@/lib/actions/contract-clauses";
import { useToast } from "@/components/admin/Toast";
import { CONTRACT_TEMPLATE_KINDS, contractTemplateLabels } from "@/lib/contracts/templates";
import type { ContractClauseBlock } from "@/lib/contracts/blocks";

const SCOPE_LABEL: Record<string, string> = {
  common: "공통",
  service: "서비스별",
  quote: "견적별",
};
const COND_LABEL: Record<string, string> = {
  always: "항상",
  recurring: "정기결제 시",
  has_deliverables: "산출물 있을 때",
};

const empty: ContractClauseBlock = {
  key: "",
  scope: "common",
  template_kinds: null,
  condition: "always",
  title: "",
  body: "",
  sort_order: 100,
  active: true,
};

export function ClauseAdmin({
  builtin,
  custom,
  overriddenKeys,
}: {
  builtin: ContractClauseBlock[];
  custom: ContractClauseBlock[];
  overriddenKeys: string[];
}) {
  const [form, setForm] = useState<ContractClauseBlock>(empty);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();
  const overridden = new Set(overriddenKeys);
  const customKeys = new Set(custom.map((c) => c.key));

  function edit(b: ContractClauseBlock) {
    setForm({ ...b, template_kinds: b.template_kinds ?? null });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function save() {
    const fd = new FormData();
    fd.set("key", form.key);
    fd.set("scope", form.scope);
    fd.set("condition", form.condition);
    fd.set("title", form.title);
    fd.set("body", form.body);
    fd.set("sort_order", String(form.sort_order));
    fd.set("active", form.active ? "on" : "off");
    if (form.scope === "service" && form.template_kinds) {
      for (const k of form.template_kinds) fd.set(`kind_${k}`, "on");
    }
    startTransition(async () => {
      const r = await upsertClauseBlockAction(fd);
      if (r.ok) {
        push("조항 블록을 저장했습니다");
        setForm(empty);
        router.refresh();
      } else push(r.error ?? "저장 실패", "error");
    });
  }

  function remove(key: string) {
    if (!window.confirm("이 커스텀 조항을 삭제할까요?")) return;
    startTransition(async () => {
      const r = await deleteClauseBlockAction(key);
      if (r.ok) {
        push("삭제했습니다");
        router.refresh();
      } else push(r.error ?? "삭제 실패", "error");
    });
  }

  function disable(b: ContractClauseBlock) {
    startTransition(async () => {
      const r = await disableBuiltinBlockAction({
        key: b.key,
        scope: b.scope,
        template_kinds: b.template_kinds,
        condition: b.condition,
        title: b.title,
        body: b.body,
        sort_order: b.sort_order,
      });
      if (r.ok) {
        push("기본 조항을 비활성화했습니다");
        router.refresh();
      } else push(r.error ?? "실패", "error");
    });
  }

  const toggleKind = (k: (typeof CONTRACT_TEMPLATE_KINDS)[number]) => {
    setForm((f) => {
      const cur = new Set(f.template_kinds ?? []);
      if (cur.has(k)) cur.delete(k);
      else cur.add(k);
      const arr = [...cur];
      return { ...f, template_kinds: arr.length ? arr : null };
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      {/* Editor */}
      <section className="space-y-3 rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[14px] font-bold text-ink-100">
          {customKeys.has(form.key) || overridden.has(form.key)
            ? "조항 수정/덮어쓰기"
            : "새 조항 블록"}
        </h2>
        <Field label="key (영소문자·숫자·_)">
          <input
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="예: scope_video"
            className="w-full rounded-lg border border-ink-15 px-3 py-2 font-mono text-[12px]"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="레이어">
            <select
              value={form.scope}
              onChange={(e) =>
                setForm({ ...form, scope: e.target.value as ContractClauseBlock["scope"] })
              }
              className="w-full rounded-lg border border-ink-15 px-2 py-2 text-[12.5px]"
            >
              <option value="common">공통</option>
              <option value="service">서비스별</option>
              <option value="quote">견적별</option>
            </select>
          </Field>
          <Field label="조건">
            <select
              value={form.condition}
              onChange={(e) =>
                setForm({
                  ...form,
                  condition: e.target.value as ContractClauseBlock["condition"],
                })
              }
              className="w-full rounded-lg border border-ink-15 px-2 py-2 text-[12.5px]"
            >
              <option value="always">항상</option>
              <option value="recurring">정기결제 시</option>
              <option value="has_deliverables">산출물 있을 때</option>
            </select>
          </Field>
        </div>
        {form.scope === "service" ? (
          <Field label="적용 서비스 유형 (미선택 = 전체)">
            <div className="flex flex-wrap gap-2">
              {CONTRACT_TEMPLATE_KINDS.map((k) => (
                <label key={k} className="flex items-center gap-1 text-[11.5px] text-ink-70">
                  <input
                    type="checkbox"
                    checked={form.template_kinds?.includes(k) ?? false}
                    onChange={() => toggleKind(k)}
                    className="h-3.5 w-3.5 accent-iris"
                  />
                  {contractTemplateLabels[k]}
                </label>
              ))}
            </div>
          </Field>
        ) : null}
        <Field label="조항 제목">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="예: 업무 범위"
            className="w-full rounded-lg border border-ink-15 px-3 py-2 text-[13px]"
          />
        </Field>
        <Field label="본문 ({{token}} 사용 가능)">
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={6}
            className="w-full resize-y rounded-lg border border-ink-15 px-3 py-2 text-[12.5px] leading-[1.7]"
          />
          <p className="mt-1 text-[10.5px] text-ink-50">
            토큰: customerName, projectTitle, serviceType, amount, depositRate,
            depositAmount, balanceAmount, monthlyAmount, revisionCount,
            deliveryText, deliverables
          </p>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="정렬 순서">
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-ink-15 px-3 py-2 text-[13px]"
            />
          </Field>
          <label className="mt-6 flex items-center gap-2 text-[12.5px] text-ink-70">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 accent-iris"
            />
            활성
          </label>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="rounded-lg bg-ink-100 px-4 py-2 font-display text-[13px] font-bold text-white disabled:opacity-50"
          >
            저장
          </button>
          {form.key ? (
            <button
              type="button"
              onClick={() => setForm(empty)}
              className="rounded-lg border border-ink-15 px-4 py-2 font-display text-[13px] font-bold text-ink-70"
            >
              초기화
            </button>
          ) : null}
        </div>
      </section>

      {/* Lists */}
      <div className="space-y-5">
        {custom.length > 0 ? (
          <section className="rounded-2xl border border-ink-15 bg-white p-5">
            <h2 className="font-display text-[14px] font-bold text-ink-100">
              커스텀 조항 <span className="num text-ink-50">{custom.length}</span>
            </h2>
            <ul className="mt-3 space-y-2">
              {custom.map((b) => (
                <Row
                  key={b.key}
                  b={b}
                  badge={overridden.has(b.key) ? "기본 덮어씀" : "커스텀"}
                  onEdit={() => edit(b)}
                  onDelete={() => remove(b.key)}
                />
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl border border-ink-15 bg-white p-5">
          <h2 className="font-display text-[14px] font-bold text-ink-100">
            기본 조항 <span className="num text-ink-50">{builtin.length}</span>
          </h2>
          <ul className="mt-3 space-y-2">
            {builtin.map((b) => (
              <Row
                key={b.key}
                b={b}
                badge={overridden.has(b.key) ? "재정의됨" : "기본"}
                muted={overridden.has(b.key)}
                onEdit={() => edit(b)}
                onDisable={!overridden.has(b.key) ? () => disable(b) : undefined}
              />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] font-bold text-ink-70">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Row({
  b,
  badge,
  muted,
  onEdit,
  onDelete,
  onDisable,
}: {
  b: ContractClauseBlock;
  badge: string;
  muted?: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onDisable?: () => void;
}) {
  return (
    <li
      className={`flex items-start justify-between gap-3 rounded-lg border border-ink-15 px-3 py-2.5 ${
        muted ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-ink-5 px-2 py-0.5 text-[10px] font-bold text-ink-70">
            {SCOPE_LABEL[b.scope]}
          </span>
          {b.condition !== "always" ? (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
              {COND_LABEL[b.condition]}
            </span>
          ) : null}
          {b.template_kinds?.length ? (
            <span className="text-[10px] text-ink-50">
              {b.template_kinds.map((k) => contractTemplateLabels[k]).join(", ")}
            </span>
          ) : null}
          {!b.active ? (
            <span className="text-[10px] font-bold text-error">비활성</span>
          ) : null}
        </div>
        <p className="mt-1 font-display text-[12.5px] font-bold text-ink-100">
          {b.sort_order}. {b.title}
        </p>
        <p className="font-mono text-[10px] text-ink-50">{b.key}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-[11px]">
        <span className="text-ink-30">{badge}</span>
        <button type="button" onClick={onEdit} className="font-bold text-iris hover:underline">
          {onDelete ? "수정" : "덮어쓰기"}
        </button>
        {onDisable ? (
          <button type="button" onClick={onDisable} className="font-bold text-ink-50 hover:text-error">
            비활성화
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" onClick={onDelete} className="font-bold text-error hover:underline">
            삭제
          </button>
        ) : null}
      </div>
    </li>
  );
}
