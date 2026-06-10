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
  SERVICE_SCOPE_ROWS,
  type ServiceScopeKey,
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
  const initialScopes = Array.isArray(
    (contract.metadata as { scope_keys?: ServiceScopeKey[] } | null)?.scope_keys,
  )
    ? ((contract.metadata as { scope_keys?: ServiceScopeKey[] }).scope_keys as ServiceScopeKey[])
    : [];
  const [scopeKeys, setScopeKeys] = useState<ServiceScopeKey[]>(initialScopes);
  const toggleScope = (k: ServiceScopeKey) =>
    setScopeKeys((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );

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
        <label className="text-[12px] font-bold text-ink-70">
          업무 범위 (체크박스)
        </label>
        <div className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {SERVICE_SCOPE_ROWS.map((r) => (
            <label
              key={r.key}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px] ${
                scopeKeys.includes(r.key)
                  ? "border-iris/40 bg-iris/[0.06] text-ink-100"
                  : "border-ink-15 text-ink-70"
              } ${pending || locked ? "opacity-60" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                className="accent-iris"
                disabled={pending || locked}
                checked={scopeKeys.includes(r.key)}
                onChange={() => toggleScope(r.key)}
              />
              {r.label}
            </label>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || locked || scopeKeys.length === 0}
            onClick={() =>
              run(
                () => changeContractTemplateAction(contract.id, scopeKeys),
                "업무 범위를 적용하고 계약서를 재생성했습니다",
              )
            }
            className="rounded-lg bg-iris px-3 py-1.5 font-display text-[12px] font-bold text-white disabled:opacity-50"
          >
            업무 범위 적용 (재생성)
          </button>
          <button
            type="button"
            disabled={pending || locked}
            onClick={() =>
              run(
                () => changeContractTemplateAction(contract.id),
                "견적 항목 기준으로 업무 범위를 자동 체크하고 재생성했습니다",
              )
            }
            className="rounded-lg border border-ink-15 bg-white px-3 py-1.5 font-display text-[12px] font-bold text-ink-70 disabled:opacity-50"
          >
            견적 항목 기준 자동 체크
          </button>
        </div>
        <p className="mt-1 text-[11px] text-ink-50">
          제목은 항상 「용역계약서」이며, 체크한 업무 범위가 본문 [업무 범위]에 ● 표시됩니다.
          웹사이트 항목 체크 시 웹 기술 조항이 추가됩니다. 서명 완료 건은 변경할 수 없습니다.
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
