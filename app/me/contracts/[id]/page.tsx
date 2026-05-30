import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getMyContract } from "@/lib/queries/contracts";
import { ContractDocument } from "@/components/ContractDocument";
import { contractTemplateLabels } from "@/lib/contracts/templates";
import { contractStatusLabels } from "@/lib/types/db";
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
          <Summary label="상태" value={contractStatusLabels[contract.status]} />
        </dl>
        <p className="mt-3 text-[11.5px] text-ink-50">
          VAT 별도 · 전체 조항은 아래 계약 전문에서 확인하세요.
        </p>
      </section>

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
