import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { adminGetContract } from "@/lib/queries/contracts";
import { ContractDocument } from "@/components/ContractDocument";
import { PrintBar } from "@/components/PrintBar";

export const metadata: Metadata = {
  title: "계약서 · STUDIO BODA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminContractPrintPage({
  params,
}: {
  params: { id: string };
}) {
  await requireStaff();
  const data = await adminGetContract(params.id);
  if (!data) notFound();
  const { contract } = data;

  return (
    <div className="bg-ink-5 print:bg-white">
      <PrintBar
        backHref={`/admin/contracts/${contract.id}`}
        backLabel="← 계약 상세로"
      />
      <ContractDocument
        contract={contract}
        client={{
          name: contract.client_name ?? "고객",
          email: contract.client_email,
        }}
      />
    </div>
  );
}
