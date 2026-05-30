import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getMyContract } from "@/lib/queries/contracts";
import { ContractDocument } from "@/components/ContractDocument";
import { PrintBar } from "@/components/PrintBar";

export const metadata: Metadata = {
  title: "계약서 · STUDIO BODA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Customer-facing printable contract. Outside the /me layout so portal chrome
// is excluded from the PDF. Ownership enforced by getMyContract.
export default async function CustomerContractPrintPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getProfile();
  if (!me) redirect(`/login?next=/contract/${params.id}/print`);
  const contract = await getMyContract(me.id, params.id);
  if (!contract) notFound();

  const clientName =
    (me.account_type === "business" ? me.company_name : me.name) ||
    me.name ||
    me.company_name ||
    me.email;

  return (
    <div className="bg-ink-5 print:bg-white">
      <PrintBar backHref={`/me/contracts/${contract.id}`} backLabel="← 계약서 상세로" />
      <ContractDocument
        contract={contract}
        client={{
          name: clientName,
          company: me.account_type === "business" ? me.company_name : null,
          email: me.email,
        }}
      />
    </div>
  );
}
