"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setNotificationChannelsAction,
  sendTestNotificationAction,
} from "@/lib/actions/notification-settings";
import { useToast } from "@/components/admin/Toast";

export function NotificationSettingsForm({
  initialEmail,
  initialKakao,
  kakaoDryRun,
}: {
  initialEmail: boolean;
  initialKakao: boolean;
  kakaoDryRun: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [kakao, setKakao] = useState(initialKakao);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  function save() {
    startTransition(async () => {
      const r = await setNotificationChannelsAction(email, kakao);
      if (r.ok) {
        push("알림 채널 설정을 저장했습니다");
        router.refresh();
      } else push(r.error ?? "저장 실패", "error");
    });
  }

  function test() {
    startTransition(async () => {
      const r = await sendTestNotificationAction();
      if (r.ok) push("테스트 알림을 발송했습니다 (본인 계정 + 카카오는 dryRun 로그)");
      else push(r.error ?? "발송 실패", "error");
    });
  }

  return (
    <section className="rounded-2xl border border-ink-15 bg-white p-5">
      <h2 className="font-display text-[14px] font-bold text-ink-100">발송 채널</h2>
      <div className="mt-3 space-y-3">
        <Toggle
          label="웹 알림 (in-app)"
          desc="항상 활성화 — 끌 수 없습니다."
          checked
          disabled
          onChange={() => {}}
        />
        <Toggle
          label="이메일 알림 (Resend)"
          desc="고객의 이메일 수신 동의가 있는 경우 발송됩니다."
          checked={email}
          onChange={setEmail}
          disabled={pending}
        />
        <Toggle
          label="카카오 알림톡"
          desc={
            kakaoDryRun
              ? "현재 dryRun 모드 — 켜도 실제 발송되지 않고 로그만 남습니다."
              : "고객의 카카오 수신 동의 + 전화번호가 있는 경우 발송됩니다."
          }
          checked={kakao}
          onChange={setKakao}
          disabled={pending}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-lg bg-ink-100 px-4 py-2 font-display text-[13px] font-bold text-white disabled:opacity-50"
        >
          저장
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={test}
          className="rounded-lg border border-ink-15 px-4 py-2 font-display text-[13px] font-bold text-ink-70 hover:border-ink-30"
        >
          테스트 발송 (본인)
        </button>
      </div>
    </section>
  );
}

function Toggle({
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
    <label className="flex items-start justify-between gap-4 rounded-lg border border-ink-15 px-3.5 py-3">
      <span>
        <span className="font-display text-[13px] font-bold text-ink-100">{label}</span>
        <span className="mt-0.5 block text-[11.5px] text-ink-50">{desc}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-iris disabled:opacity-50"
      />
    </label>
  );
}
