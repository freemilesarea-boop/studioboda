"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfileAction } from "@/lib/actions/account";
import type { Profile } from "@/lib/types/db";

const input =
  "h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60";

export function AccountForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(
    null,
  );
  const router = useRouter();
  const isBusiness = profile.account_type === "business";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const r = await updateMyProfileAction(fd);
      if (r.ok) {
        setMsg({ tone: "ok", text: "저장되었습니다" });
        router.refresh();
      } else {
        setMsg({ tone: "err", text: r.error ?? "저장 실패" });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={isBusiness ? "담당자명" : "이름"}>
          <input
            name="name"
            defaultValue={profile.name ?? ""}
            placeholder="홍길동"
            className={input}
          />
        </Field>
        <Field label="이메일" hint="이메일은 변경할 수 없습니다">
          <input
            value={profile.email}
            disabled
            className={`${input} bg-ink-5 text-ink-50`}
          />
        </Field>
        <Field label={isBusiness ? "대표 전화" : "전화번호"}>
          <input
            name="phone"
            defaultValue={profile.phone ?? ""}
            placeholder="010-0000-0000"
            className={input}
          />
        </Field>
        {isBusiness ? null : (
          <Field label="주소 (선택)">
            <input
              name="address"
              defaultValue={profile.address ?? ""}
              placeholder="서울특별시 …"
              className={input}
            />
          </Field>
        )}
      </div>

      {isBusiness ? (
        <div className="grid grid-cols-1 gap-4 border-t border-ink-15 pt-4 sm:grid-cols-2">
          <Field label="회사명">
            <input
              name="company_name"
              defaultValue={profile.company_name ?? ""}
              placeholder="예: 루베르 콘텐츠 스튜디오"
              className={input}
            />
          </Field>
          <Field label="대표자명">
            <input
              name="representative_name"
              defaultValue={profile.representative_name ?? ""}
              className={input}
            />
          </Field>
          <Field label="사업자등록번호">
            <input
              name="business_registration_number"
              defaultValue={profile.business_registration_number ?? ""}
              placeholder="000-00-00000"
              className={input}
            />
          </Field>
          <Field label="업종">
            <input
              name="industry"
              defaultValue={profile.industry ?? ""}
              placeholder="콘텐츠 제작 / 광고 / …"
              className={input}
            />
          </Field>
          <Field label="실무 담당자명">
            <input
              name="contact_name"
              defaultValue={profile.contact_name ?? ""}
              className={input}
            />
          </Field>
          <Field label="실무 담당자 연락처">
            <input
              name="contact_phone"
              defaultValue={profile.contact_phone ?? ""}
              placeholder="010-0000-0000"
              className={input}
            />
          </Field>
          <Field label="사업장 주소" className="sm:col-span-2">
            <input
              name="business_address"
              defaultValue={profile.business_address ?? ""}
              placeholder="서울특별시 …"
              className={input}
            />
          </Field>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-ink-15 pt-4">
        <p
          aria-live="polite"
          className={`text-[12.5px] font-semibold ${
            msg?.tone === "ok"
              ? "text-success"
              : msg?.tone === "err"
              ? "text-error"
              : "text-transparent"
          }`}
        >
          {msg?.text ?? "."}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-lg bg-ink-100 px-5 font-display text-[13px] font-bold text-white hover:bg-ink-90 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] text-ink-50">{hint}</span>
      ) : null}
    </label>
  );
}
