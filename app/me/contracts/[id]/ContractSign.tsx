"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SignaturePad } from "@/components/SignaturePad";
import {
  markContractViewedAction,
  signContractAction,
} from "@/lib/actions/contracts";
import { useToast } from "@/components/admin/Toast";

export function ContractSign({
  contractId,
  alreadySigned,
  canSign,
}: {
  contractId: string;
  alreadySigned: boolean;
  canSign: boolean;
}) {
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  // Record the view once on mount.
  useEffect(() => {
    void markContractViewedAction(contractId);
  }, [contractId]);

  if (alreadySigned) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/[0.06] p-5 text-[13px] text-ink-70">
        <i className="ti ti-circle-check mr-1.5 text-success" aria-hidden />
        서명이 완료되었습니다. 계약서 사본은 언제든 다운로드할 수 있습니다.
      </div>
    );
  }

  if (!canSign) {
    return (
      <div className="rounded-2xl border border-ink-15 bg-white p-5 text-[12.5px] text-ink-50">
        현재 상태에서는 서명할 수 없습니다.
      </div>
    );
  }

  function submit() {
    if (!agreed) {
      push("계약 내용 동의에 체크해주세요", "error");
      return;
    }
    if (!signature) {
      push("서명을 입력해주세요", "error");
      return;
    }
    startTransition(async () => {
      const r = await signContractAction(contractId, signature);
      if (r.ok) {
        push("전자서명이 완료되었습니다");
        router.refresh();
      } else {
        push(r.error ?? "서명 실패", "error");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-iris/30 bg-iris-light/40 p-5">
      <h2 className="font-display text-[14px] font-bold text-ink-100">전자서명</h2>
      <p className="mt-1 text-[12px] text-ink-50">
        계약 내용을 검토하신 후 아래에 서명해주세요. 서명 시점과 서명 이미지가
        기록됩니다.
      </p>

      <label className="mt-4 flex items-start gap-2 text-[12.5px] text-ink-70">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-iris"
        />
        <span>위 계약서의 내용을 모두 확인하였으며 이에 동의합니다.</span>
      </label>

      <div className="mt-4">
        <SignaturePad onChange={setSignature} disabled={pending} />
      </div>

      <button
        type="button"
        disabled={pending || !agreed || !signature}
        onClick={submit}
        className="mt-4 inline-flex h-11 items-center rounded-lg bg-iris px-5 font-display text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-50"
      >
        서명하고 계약 체결 →
      </button>
    </section>
  );
}
