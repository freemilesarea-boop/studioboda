import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getMyContract, getContractDepositInfo } from "@/lib/queries/contracts";
import { ContractDocument } from "@/components/ContractDocument";
import { contractTemplateLabels } from "@/lib/contracts/templates";
import { contractStage, contractStageLabels } from "@/lib/contracts/stage";
import { ContractSign } from "./ContractSign";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export const metadata: Metadata = {
  title: "계약서 상세",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MyContractDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getProfile();
  if (!me) return null;
  const contract = await getMyContract(me.id, params.id);
  if (!contract) notFound();

  const deposit = await getContractDepositInfo(contract.quote_id);
  const depositPaid = deposit.status === "paid";
  const stage = contractStage(contract, depositPaid);

  const clientName =
    (me.account_type === "business" ? me.company_name : me.name) ||
    me.name ||
    me.company_name ||
    me.email;

  const alreadySigned = Boolean(contract.client_signature);
  const canSign = !["cancelled", "expired"].includes(contract.status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/me/contracts"
          className="inline-flex items-center gap-1 text-[12px] text-ink-50 hover:text-iris"
        >
          ← 계약서 목록
        </Link>
        <Link
          href={`/contract/${contract.id}/print`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-15 bg-white px-3 py-1.5 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
        >
          <i className="ti ti-download text-[14px]" aria-hidden />
          PDF 다운로드
        </Link>
      </div>

      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[14px] font-bold text-ink-100">
          계약 핵심 요약
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Summary label="계약번호" value={contract.contract_number} mono />
          <Summary
            label="계약 유형"
            value={contractTemplateLabels[contract.template_kind]}
          />
          <Summary label="계약 금액" value={`${fmt(contract.amount)}원`} accent />
          <Summary label="진행 상태" value={contractStageLabels[stage]} />
        </dl>
        <p className="mt-3 text-[11.5px] text-ink-50">
          VAT 별도 · 전체 조항은 아래 계약 전문에서 확인하세요.
        </p>
      </section>

      <DepositPanel
        contractId={contract.id}
        depositStatus={deposit.status}
        amount={deposit.amount ?? Math.round((contract.amount * 30) / 100)}
        payUrl={deposit.payUrl}
        clientSigned={Boolean(contract.client_signature)}
      />

      <div className="overflow-hidden rounded-2xl border border-ink-15">
        <ContractDocument
          contract={contract}
          client={{
            name: clientName,
            company: me.account_type === "business" ? me.company_name : null,
            email: me.email,
          }}
        />
      </div>

      <ContractSign
        contractId={contract.id}
        alreadySigned={alreadySigned}
        canSign={canSign}
      />
    </div>
  );
}

function Summary({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-caption text-ink-50">
        {label}
      </dt>
      <dd
        className={`mt-1 font-display text-[14px] font-bold ${
          accent ? "text-iris" : "text-ink-100"
        } ${mono ? "font-mono text-[12px]" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

// 예약금(30%) 결제 안내 — 서명 전/후 모두 결제 상태를 보여주고, 미결제 시
// PayApp 결제 링크 버튼을 노출한다. 결제는 계약서 확인 후 고객이 진행한다.
function DepositPanel({
  contractId,
  depositStatus,
  amount,
  payUrl,
  clientSigned,
}: {
  contractId: string;
  depositStatus: "paid" | "pending" | "none";
  amount: number;
  payUrl: string | null;
  clientSigned: boolean;
}) {
  void contractId;
  if (depositStatus === "paid") {
    return (
      <section className="rounded-2xl border border-success/30 bg-success/[0.06] p-5">
        <div className="flex items-center gap-2">
          <i className="ti ti-circle-check text-[18px] text-success" aria-hidden />
          <h2 className="font-display text-[14px] font-bold text-ink-100">
            예약금 결제 완료
          </h2>
        </div>
        <p className="mt-1.5 text-[12.5px] text-ink-70">
          예약금 <b className="num">{fmt(amount)}원</b>이 결제되었습니다. 운영팀이 제작을
          착수합니다.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-iris/30 bg-iris-light/40 p-5">
      <h2 className="font-display text-[14px] font-bold text-ink-100">
        예약금 결제 (30%)
      </h2>
      <p className="mt-1 text-[12px] text-ink-50">
        {clientSigned
          ? "서명이 완료되었습니다. 아래에서 예약금을 결제하면 제작이 착수됩니다."
          : "계약 내용을 확인하고 서명하신 뒤 예약금을 결제해주세요. 지금 결제하셔도 됩니다."}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="num font-display text-[22px] font-extrabold tracking-tightish text-iris">
          {fmt(amount)}원
          <span className="ml-1 text-[11px] font-bold text-ink-50">VAT 별도</span>
        </p>
        {payUrl ? (
          <a
            href={payUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-lg bg-iris px-5 font-display text-[13px] font-bold text-white hover:opacity-90"
          >
            예약금 결제하기 →
          </a>
        ) : (
          <span className="text-[11.5px] text-warning">
            결제 링크 발급 중 · 운영팀이 곧 안내합니다
          </span>
        )}
      </div>
    </section>
  );
}
