import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getMyContract } from "@/lib/queries/contracts";
import { ContractDocument } from "@/components/ContractDocument";
import { ContractSign } from "./ContractSign";

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
