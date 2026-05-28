"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signupBusinessAction } from "@/lib/actions/auth";
import {
  Field,
  FieldError,
  Honeypot,
  SubmitButton,
  fieldCls,
} from "./fields";

export function BusinessForm() {
  const [companyName, setCompanyName] = useState("");
  const [repName, setRepName] = useState("");
  const [brn, setBrn] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agree, setAgree] = useState(false);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await signupBusinessAction({
        company_name: companyName,
        representative_name: repName,
        business_registration_number: brn,
        contact_name: contactName,
        contact_phone: contactPhone,
        business_address: businessAddress,
        industry,
        username,
        email,
        password: pw,
        password_confirm: pw2,
        agree,
        website,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (r.autoLogin) {
        router.replace(r.next);
        router.refresh();
      } else {
        router.replace("/login?signup=1");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Honeypot value={website} onChange={setWebsite} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="상호명" required>
          <input
            className={fieldCls}
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="(주)스튜디오 보다"
            autoComplete="organization"
          />
        </Field>
        <Field label="대표자명" required>
          <input
            className={fieldCls}
            required
            value={repName}
            onChange={(e) => setRepName(e.target.value)}
            placeholder="홍길동"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="사업자등록번호" required hint="000-00-00000">
          <input
            className={fieldCls}
            required
            value={brn}
            onChange={(e) => setBrn(e.target.value)}
            placeholder="123-45-67890"
            inputMode="numeric"
          />
        </Field>
        <Field label="업종" required>
          <input
            className={fieldCls}
            required
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="예: 도소매·콘텐츠 제작"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="담당자 이름" required>
          <input
            className={fieldCls}
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="담당자 성함"
            autoComplete="name"
          />
        </Field>
        <Field label="담당자 전화번호" required>
          <input
            className={fieldCls}
            required
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="010-0000-0000"
            autoComplete="tel"
            inputMode="tel"
          />
        </Field>
      </div>

      <Field label="사업장 주소" required>
        <input
          className={fieldCls}
          required
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          placeholder="서울특별시 ..."
          autoComplete="street-address"
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="아이디" required hint="영문/숫자/._- 만, 4자 이상">
          <input
            className={fieldCls}
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="brand_admin"
            autoComplete="username"
            spellCheck={false}
          />
        </Field>
        <Field label="이메일" required>
          <input
            type="email"
            className={fieldCls}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@brand.kr"
            autoComplete="email"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="비밀번호" required hint="8자 이상">
          <input
            type="password"
            className={fieldCls}
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <Field label="비밀번호 확인" required>
          <input
            type="password"
            className={fieldCls}
            required
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
      </div>

      <label className="flex items-start gap-2 pt-1 text-[12px] text-ink-30">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 accent-iris"
        />
        <span>
          이용약관 및 개인정보 처리방침에 동의합니다.{" "}
          <span className="text-ink-50">
            (견적 응대 및 프로젝트 운영 목적으로만 사용됩니다.)
          </span>
        </span>
      </label>

      <FieldError message={error} />

      <SubmitButton
        pending={pending}
        label="사업자 회원 가입"
        pendingLabel="가입 중…"
      />
    </form>
  );
}
