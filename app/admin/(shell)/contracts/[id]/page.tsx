import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireStaff } from "@/lib/auth";
import { adminGetContract, getContractCopyLastSentAt } from "@/lib/queries/contracts";
import { ContractDocument } from "@/components/ContractDocument";
import { ContractAdminControls } from "./ContractAdminControls";
import { ContractCopyEmailButton } from "./ContractCopyEmailButton";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Contract",
  robots: { index: false, follow: false },
};

export default async function AdminContractDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireStaff();
  const data = await adminGetContract(params.id);
  if (!data) notFound();
  const { contract, versions } = data;
  const signed =
    Boolean(contract.client_signature) ||
    Boolean(contract.signed_at) ||
    contract.status === "signed";
  const copyLastSentAt = await getContractCopyLastSentAt(contract.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/admin/contracts"
          className="text-[12px] text-ink-50 hover:text-iris"
        >
          ← 계약서 목록
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/print/contract/${contract.id}`}
            className="rounded-lg border border-ink-15 bg-white px-3 py-1.5 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
          >
            인쇄 / PDF
          </Link>
          <ContractCopyEmailButton
            contractId={contract.id}
            signed={signed}
            recipientEmail={contract.client_email}
            lastSentAt={copyLastSentAt}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl border border-ink-15">
          <ContractDocument
            contract={contract}
            client={{
              name: contract.client_name ?? "고객",
              email: contract.client_email,
            }}
          />
        </div>

        <div className="space-y-5">
          <ContractAdminControls contract={contract} />

          <section className="rounded-2xl border border-ink-15 bg-white p-5">
            <h2 className="font-display text-[14px] font-bold text-ink-100">
              버전 이력
              <span className="num ml-1.5 text-[12px] font-bold text-ink-50">
                {versions.length}
              </span>
            </h2>
            <ul className="mt-3 space-y-2">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-ink-15 px-3 py-2 text-[12px]"
                >
                  <span className="font-display font-bold text-ink-100">
                    v{v.version}
                  </span>
                  <span className="text-ink-50">
                    {format(new Date(v.created_at), "yyyy-MM-dd HH:mm")}
                  </span>
                </li>
              ))}
              {versions.length === 0 ? (
                <li className="text-[12px] text-ink-50">버전 기록 없음</li>
              ) : null}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
