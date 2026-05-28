"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createInquiryAction } from "@/lib/actions/inquiries";
import { createBrowserAuthSupabase } from "@/lib/supabase/browser";

const SERVICES = [
  "상세페이지",
  "SNS 콘텐츠",
  "광고 배너",
  "썸네일",
  "브랜드 디자인",
  "회사소개서",
  "브랜드 패키지",
  "정기 구독",
  "기타",
];

const BUDGETS = [
  "~50만",
  "50~150만",
  "150~300만",
  "300~700만",
  "700만+",
  "협의",
];

export type InquiryFormDefaults = {
  service_type?: string;
  budget_range?: string;
  message?: string;
};

export function InquiryForm({
  defaults,
  variant = "light",
  compact = false,
  onSuccess,
}: {
  defaults?: InquiryFormDefaults;
  variant?: "light" | "dark";
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [service, setService] = useState(defaults?.service_type ?? "");
  const [budget, setBudget] = useState(defaults?.budget_range ?? "");
  const [message, setMessage] = useState(defaults?.message ?? "");
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const [authedProfile, setAuthedProfile] = useState<
    | {
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        company_name?: string | null;
      }
    | null
  >(null);

  // Auth + prefill from logged-in profile (one-shot, server-resolved).
  useEffect(() => {
    let active = true;
    const supabase = createBrowserAuthSupabase();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!active || !user) return;
      const meta = (user.user_metadata ?? {}) as { name?: string };
      // Fetch the profile fields to prefill thoroughly.
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as {
            name?: string | null;
            email?: string | null;
            phone?: string | null;
            contact_phone?: string | null;
            company_name?: string | null;
            account_type?: "individual" | "business";
          };
          if (!active) return;
          setAuthedProfile({
            name: data.name ?? meta.name ?? null,
            email: data.email ?? user.email ?? null,
            phone: data.phone ?? data.contact_phone ?? null,
            company_name: data.company_name ?? null,
          });
          if (data.name && !name) setName(data.name);
          if (data.email && !email) setEmail(data.email);
          if ((data.phone ?? data.contact_phone) && !phone) {
            setPhone(data.phone ?? data.contact_phone ?? "");
          }
          if (data.company_name && !company) setCompany(data.company_name);
        } else {
          setAuthedProfile({
            name: meta.name ?? null,
            email: user.email ?? null,
          });
          if (meta.name && !name) setName(meta.name);
          if (user.email && !email) setEmail(user.email);
        }
      } catch {
        setAuthedProfile({
          name: meta.name ?? null,
          email: user.email ?? null,
        });
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick up prefill from QuoteCalculator (same-page event + post-signup sessionStorage).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ service_type?: string; message?: string }>).detail;
      if (detail?.service_type) setService(detail.service_type);
      if (detail?.message) setMessage(detail.message);
      setDone(false);
    };
    window.addEventListener("boda:quote-prefill", handler);

    try {
      const stash = sessionStorage.getItem("boda:quote-prefill");
      if (stash) {
        const parsed = JSON.parse(stash) as {
          service_type?: string;
          message?: string;
        };
        if (parsed.service_type) setService(parsed.service_type);
        if (parsed.message) setMessage(parsed.message);
        sessionStorage.removeItem("boda:quote-prefill");
      }
    } catch {
      /* ignore */
    }

    return () => window.removeEventListener("boda:quote-prefill", handler);
  }, []);

  const isDark = variant === "dark";

  const fieldCls = isDark
    ? "h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 text-[13.5px] text-white outline-none placeholder:text-ink-50 focus:border-iris-glow/60"
    : "h-11 w-full rounded-lg border border-ink-15 bg-white px-3 text-[13.5px] text-ink-100 outline-none focus:border-iris/60";
  const labelCls = isDark
    ? "mb-1.5 block font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-30"
    : "mb-1.5 block font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await createInquiryAction({
        name,
        email,
        phone,
        company,
        service_type: service || undefined,
        budget_range: budget || undefined,
        message: message || undefined,
        website,
      });
      if (!r.ok) {
        setError(r.error || "오류가 발생했습니다");
        return;
      }
      setDone(true);
      onSuccess?.();
    });
  }

  if (done) {
    return (
      <div
        className={`rounded-2xl border p-6 text-center ${
          isDark
            ? "border-iris-glow/30 bg-iris/[0.08] text-white"
            : "border-iris/30 bg-iris-light text-ink-100"
        }`}
      >
        <p className="font-display text-[14px] font-bold">
          문의가 정상적으로 접수되었습니다.
        </p>
        <p className={`mt-1.5 text-[12.5px] ${isDark ? "text-ink-30" : "text-ink-70"}`}>
          평균 24시간 이내에 회신 드립니다. hello@studioboda.kr
        </p>
        {authedProfile ? (
          <Link
            href="/me"
            className={`mt-4 inline-flex h-9 items-center justify-center rounded-lg px-4 text-[12.5px] font-bold ${
              isDark
                ? "bg-white text-ink-100 hover:opacity-90"
                : "bg-ink-100 text-white hover:bg-ink-90"
            }`}
          >
            내 문의 보기 →
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {authedProfile ? (
        <div
          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[11.5px] ${
            isDark
              ? "border-iris-glow/30 bg-iris/[0.08] text-iris-glow"
              : "border-iris/30 bg-iris-light text-iris"
          }`}
        >
          <i className="ti ti-user-check text-[14px]" aria-hidden />
          <span>
            <b>{authedProfile.name || authedProfile.email}</b> 님으로 접수됩니다.
          </span>
        </div>
      ) : (
        <div
          className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-[11.5px] ${
            isDark
              ? "border-white/10 bg-white/[0.03] text-ink-30"
              : "border-ink-15 bg-ink-5 text-ink-70"
          }`}
        >
          <span>회원이라면 더 빠르게 접수할 수 있어요.</span>
          <Link
            href="/login"
            className={`font-bold ${isDark ? "text-white" : "text-iris"}`}
          >
            로그인 →
          </Link>
        </div>
      )}
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        aria-hidden
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className={compact ? "" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
        <label className="block">
          <span className={labelCls}>이름 *</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldCls}
            placeholder="홍길동"
          />
        </label>
        <label className="block">
          <span className={labelCls}>이메일 *</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldCls}
            placeholder="you@brand.kr"
          />
        </label>
      </div>

      <div className={compact ? "" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
        <label className="block">
          <span className={labelCls}>연락처</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldCls}
            placeholder="010-0000-0000"
          />
        </label>
        <label className="block">
          <span className={labelCls}>회사 / 브랜드</span>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={fieldCls}
            placeholder="BRAND NAME"
          />
        </label>
      </div>

      <div className={compact ? "" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
        <label className="block">
          <span className={labelCls}>서비스</span>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className={fieldCls}
          >
            <option value="">선택</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>예산</span>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={fieldCls}
          >
            <option value="">선택</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>메시지</span>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${fieldCls} h-auto min-h-[100px] resize-y py-2.5`}
          placeholder="브랜드·상품·목표·납기 등 관련 정보를 자유롭게 적어주세요."
        />
      </label>

      {error ? (
        <p
          className={`rounded-md border px-3 py-2 text-[12px] ${
            isDark
              ? "border-error/40 bg-error/10 text-error"
              : "border-error/30 bg-error/[0.06] text-error"
          }`}
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={`mt-1 inline-flex h-11 w-full items-center justify-center rounded-lg font-display text-[13px] font-bold transition-opacity disabled:opacity-60 ${
          isDark
            ? "bg-white text-ink-100 hover:opacity-90"
            : "bg-iris text-white hover:opacity-90"
        }`}
      >
        {pending ? "전송 중…" : "문의 보내기"}
      </button>

      <p
        className={`text-[10.5px] leading-[1.6] ${
          isDark ? "text-ink-50" : "text-ink-50"
        }`}
      >
        제출하신 정보는 견적 응대 목적에만 사용되며 동의 없이 제3자와 공유되지 않습니다.
      </p>
    </form>
  );
}
