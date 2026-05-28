"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signupIndividualAction } from "@/lib/actions/auth";
import {
  Field,
  FieldError,
  Honeypot,
  SubmitButton,
  fieldCls,
} from "./fields";

export function IndividualForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");
  const [address, setAddress] = useState("");
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
      const r = await signupIndividualAction({
        name,
        phone,
        birth_date: birth,
        address,
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
        <Field label="이름" required>
          <input
            className={fieldCls}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            autoComplete="name"
          />
        </Field>
        <Field label="전화번호" required>
          <input
            className={fieldCls}
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            autoComplete="tel"
            inputMode="tel"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="생년월일" required hint="YYYY-MM-DD">
          <input
            type="date"
            className={fieldCls}
            required
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
          />
        </Field>
        <Field label="아이디" required hint="영문/숫자/._- 만, 4자 이상">
          <input
            className={fieldCls}
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="myhandle"
            autoComplete="username"
            spellCheck={false}
          />
        </Field>
      </div>

      <Field label="주소" required>
        <input
          className={fieldCls}
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="서울특별시 ..."
          autoComplete="street-address"
        />
      </Field>

      <Field label="이메일" required>
        <input
          type="email"
          className={fieldCls}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@brand.kr"
          autoComplete="email"
        />
      </Field>

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
        label="가입하기"
        pendingLabel="가입 중…"
      />
    </form>
  );
}
