"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SignaturePad } from "@/components/SignaturePad";
import {
  adminSignContractAction,
  cancelContractAction,
  changeContractTemplateAction,
  saveContractDraftAction,
  sendContractAction,
} from "@/lib/actions/contracts";
import {
  CONTRACT_TEMPLATE_KINDS,
  contractTemplateLabels,
  type ContractTemplateKind,
} from "@/lib/contracts/templates";
import { useToast } from "@/components/admin/Toast";
import type { Contract } from "@/lib/types/db";

export function ContractAdminControls({ contract }: { contract: Contract }) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  const [mode, setMode] = useState<"idle" | "edit" | "sign">("idle");
  const [title, setTitle] = useState(contract.title);
  const [amount, setAmount] = useState(String(contract.amount));
  const [body, setBody] = useState(contract.body ?? "");
  const [signature, setSignature] = useState<string | null>(null);

  const locked = contract.status === "signed" || contract.status === "cancelled";

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        push(okMsg);
        setMode("idle");
        router.refresh();
      } else {
        push(r.error ?? "처리 실패", "error");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-ink-15 bg-white p-5">
      <h2 className="font-display text-[14px] font-bold text-ink-100">계약 관리</h2>
      <p className="mt-1 text-[12px] text-ink-50">
        고객 서명: {contract.client_signature ? "완료" : "대기"} · 회사 서명:{" "}
        {contract.admin_signature ? "완료" : "대기"}
      </p>

      <div className="mt-4">
        <label className="text-[12px] font-bold text-ink-70">계약서 유형</label>
        <select
          value={contract.template_kind}
          disabled={pending || locked}
          onChange={(e) =>
            run(
              () =>
                changeContractTemplateAction(
                  contract.id,
                  e.target.value as ContractTemplateKind,
                ),
              "계약서 유형을 변경하고 본문을 재생성했습니다",
            )
          }
          className="mt-1 w-full rounded-lg border border-ink-15 px-3 py-2 text-[13px] disabled:opacity-60"
        >
          {CONTRACT_TEMPLATE_KINDS.map((k) => (
            <option key={k} value={k}>
              {contractTemplateLabels[k]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-ink-50">
          유형을 바꾸면 표준 본문이 새 버전으로 재생성됩니다. 발송 전 아래에서 본문을
          직접 수정할 수 있습니다.
        </p>
      </div>

      {mode === "edit" ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-[12px] font-bold text-ink-70">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-15 px-3 py-2 text-[13px]"
            />
          </div>
          <div>
            <label className="text-[12px] font-bold text-ink-70">금액 (원)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-ink-15 px-3 py-2 text-[13px]"
            />
          </div>
          <div>
            <label className="text-[12px] font-bold text-ink-70">계약 내용</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="mt-1 w-full resize-y rounded-lg border border-ink-15 px-3 py-2 text-[12.5px] leading-[1.7]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    saveContractDraftAction(contract.id, {
                      title,
                      body,
                      amount: Number(amount.replace(/[^0-9]/g, "")),
                    }),
                  "새 버전이 저장되었습니다",
                )
              }
              className="rounded-lg bg-ink-100 px-4 py-2 font-display text-[13px] font-bold text-white disabled:opacity-50"
            >
              버전 저장
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="rounded-lg border border-ink-15 px-4 py-2 font-display text-[13px] font-bold text-ink-70"
            >
              취소
            </button>
          </div>
        </div>
      ) : mode === "sign" ? (
        <div className="mt-4 space-y-3">
          <p className="text-[12px] text-ink-50">회사(갑) 서명을 입력하세요.</p>
          <SignaturePad onChange={setSignature} disabled={pending} />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || !signature}
              onClick={() =>
                run(
                  () => adminSignContractAction(contract.id, signature as string),
                  "회사 서명이 등록되었습니다",
                )
              }
              className="rounded-lg bg-iris px-4 py-2 font-display text-[13px] font-bold text-white disabled:opacity-50"
            >
              서명 등록
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="rounded-lg border border-ink-15 px-4 py-2 font-display text-[13px] font-bold text-ink-70"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {!locked ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => setMode("edit")}
                className="rounded-lg border border-ink-15 px-3.5 py-2 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30"
              >
                내용 수정 (새 버전)
              </button>
              {contract.status === "draft" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => sendContractAction(contract.id), "고객에게 발송했습니다")}
                  className="rounded-lg bg-ink-100 px-3.5 py-2 font-display text-[12.5px] font-bold text-white disabled:opacity-50"
                >
                  고객에게 발송
                </button>
              ) : null}
              <button
                type="button"
                disabled={pending || Boolean(contract.admin_signature)}
                onClick={() => setMode("sign")}
                className="rounded-lg bg-iris px-3.5 py-2 font-display text-[12.5px] font-bold text-white disabled:opacity-50"
              >
                {contract.admin_signature ? "회사 서명 완료" : "회사(갑) 서명"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => cancelContractAction(contract.id), "계약을 취소했습니다")}
                className="rounded-lg border border-ink-15 px-3.5 py-2 font-display text-[12.5px] font-bold text-ink-70 hover:border-error/60 hover:text-error"
              >
                계약 취소
              </button>
            </>
          ) : (
            <p className="text-[12.5px] text-ink-50">
              {contract.status === "signed"
                ? "서명이 완료된 계약입니다."
                : "취소된 계약입니다."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
