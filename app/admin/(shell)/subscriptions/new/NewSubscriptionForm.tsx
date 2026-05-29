"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSubscriptionAction } from "@/lib/actions/subscriptions";

const input =
  "h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60";

const PLAN_PRESETS = [
  { key: "starter", name: "Starter", price: 190000 },
  { key: "pro", name: "Pro", price: 390000 },
];

type Member = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
};

export function NewSubscriptionForm({ members }: { members: Member[] }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<{
    subscriptionId: string;
    registrationUrl: string;
  } | null>(null);
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [planKey, setPlanKey] = useState("starter");
  const [planName, setPlanName] = useState("Starter");
  const [amount, setAmount] = useState(190000);
  const [description, setDescription] = useState("");
  const [staffNotes, setStaffNotes] = useState("");

  const selectedMember = useMemo(
    () => members.find((m) => m.id === userId),
    [members, userId],
  );

  function applyPreset(key: string) {
    const p = PLAN_PRESETS.find((p) => p.key === key);
    if (!p) return;
    setPlanKey(p.key);
    setPlanName(p.name);
    setAmount(p.price);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);
    if (!userId) {
      setErr("고객을 선택해주세요");
      return;
    }
    startTransition(async () => {
      const r = await createSubscriptionAction({
        user_id: userId,
        plan_key: planKey,
        plan_name: planName,
        monthly_amount: amount,
        description: description || null,
        staff_notes: staffNotes || null,
      });
      if (!r.ok) {
        setErr(r.error ?? "구독 생성 실패");
        return;
      }
      setOkMsg({
        subscriptionId: r.subscription_id,
        registrationUrl: r.registration_url,
      });
      router.refresh();
    });
  }

  if (okMsg) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-success/30 bg-success/[0.06] px-4 py-3 text-[13px] font-semibold text-success">
          구독이 생성되고 카드 등록 링크가 발급되었습니다.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
            카드 등록 링크 (고객에게 전달)
          </span>
          <div className="flex gap-2">
            <input
              readOnly
              value={okMsg.registrationUrl}
              className={input}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(okMsg.registrationUrl);
              }}
              className="inline-flex h-10 items-center rounded-lg border border-ink-15 bg-white px-3 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30"
            >
              복사
            </button>
          </div>
        </label>
        <p className="text-[12px] text-ink-50">
          이 링크로 고객이 카드 등록을 완료하면 즉시 첫 달 결제가 이뤄지고
          매월 같은 날짜에 자동 청구됩니다.
        </p>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() =>
              router.push(`/admin/subscriptions/${okMsg.subscriptionId}`)
            }
            className="inline-flex h-10 items-center rounded-lg bg-ink-100 px-4 font-display text-[12.5px] font-bold text-white hover:bg-ink-90"
          >
            구독 상세 열기
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/subscriptions")}
            className="inline-flex h-10 items-center rounded-lg border border-ink-15 bg-white px-4 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="고객">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className={input}
        >
          <option value="">— 회원 선택 —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {(m.name ?? m.email)} ({m.email})
              {m.phone ? ` · ${m.phone}` : " · 전화번호 없음"}
            </option>
          ))}
        </select>
        {selectedMember && !selectedMember.phone ? (
          <span className="mt-1 block text-[11px] text-error">
            전화번호가 등록되지 않은 회원입니다. PayApp 자동결제 링크 발급이 거부됩니다.
          </span>
        ) : null}
      </Field>

      <Field label="플랜 프리셋">
        <div className="flex flex-wrap gap-2">
          {PLAN_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              className={`inline-flex h-9 items-center rounded-lg border px-3 font-display text-[12px] font-bold transition-colors ${
                planKey === p.key
                  ? "border-iris bg-iris-light text-iris"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              {p.name} · {p.price.toLocaleString("ko-KR")}원
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="플랜 식별자 (slug)">
          <input
            value={planKey}
            onChange={(e) => setPlanKey(e.target.value)}
            placeholder="starter | pro | custom"
            className={input}
          />
        </Field>
        <Field label="플랜 표시명">
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Starter"
            className={input}
          />
        </Field>
        <Field label="월 결제 금액 (원)">
          <input
            type="number"
            value={amount}
            min={1000}
            step={1000}
            onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))}
            className={input}
          />
        </Field>
        <Field label="설명 (고객에게 노출)">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="예: 월 5건 콘텐츠 제작 포함"
            className={input}
          />
        </Field>
      </div>

      <Field label="내부 메모 (고객에게 노출되지 않음)">
        <textarea
          value={staffNotes}
          onChange={(e) => setStaffNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-ink-15 bg-white px-3 py-2 text-[13px] outline-none focus:border-iris/60"
        />
      </Field>

      {err ? (
        <p className="text-[12.5px] font-semibold text-error">{err}</p>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-ink-15 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-lg bg-ink-100 px-5 font-display text-[13px] font-bold text-white hover:bg-ink-90 disabled:opacity-60"
        >
          {pending ? "생성 중…" : "구독 생성 + 카드 등록 링크 발급"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </span>
      {children}
    </label>
  );
}
