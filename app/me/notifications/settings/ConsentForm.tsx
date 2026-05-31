"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateNotificationConsentAction } from "@/lib/actions/notification-settings";
import { useToast } from "@/components/admin/Toast";

export function ConsentForm({
  email,
  emailOptIn,
  kakaoOptIn,
  phone,
}: {
  email: string;
  emailOptIn: boolean;
  kakaoOptIn: boolean;
  phone: string;
}) {
  const [emailOn, setEmailOn] = useState(emailOptIn);
  const [kakaoOn, setKakaoOn] = useState(kakaoOptIn);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function save() {
    const fd = new FormData();
    if (emailOn) fd.set("email_opt_in", "on");
    if (kakaoOn) fd.set("kakao_opt_in", "on");
    startTransition(async () => {
      const r = await updateNotificationConsentAction(fd);
      if (r.ok) {
        push("알림 수신 설정을 저장했습니다");
        router.refresh();
      } else push(r.error ?? "저장 실패", "error");
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-ink-15 bg-white p-5">
      <Row
        label="이메일 알림"
        desc={`수신 주소: ${email}`}
        checked={emailOn}
        onChange={setEmailOn}
        disabled={pending}
      />
      <Row
        label="카카오 알림톡"
        desc={
          phone
            ? `수신 번호: ${phone}`
            : "전화번호가 없습니다. 계정 정보에서 번호를 먼저 등록해주세요."
        }
        checked={kakaoOn}
        onChange={setKakaoOn}
        disabled={pending || !phone}
      />
      {!phone ? (
        <Link
          href="/me/account"
          className="inline-block text-[12px] font-bold text-iris hover:underline"
        >
          계정 정보에서 전화번호 등록 →
        </Link>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="inline-flex h-10 items-center rounded-lg bg-iris px-5 font-display text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-50"
      >
        저장
      </button>
    </section>
  );
}

function Row({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span className="font-display text-[13.5px] font-bold text-ink-100">{label}</span>
        <span className="mt-0.5 block text-[12px] text-ink-50">{desc}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-iris disabled:opacity-40"
      />
    </label>
  );
}
