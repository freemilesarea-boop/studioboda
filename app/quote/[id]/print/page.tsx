import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getMyQuote } from "@/lib/queries/customer";
import { QuoteDocument } from "@/components/QuoteDocument";
import { PrintBar } from "@/components/PrintBar";

export const metadata: Metadata = {
  title: "견적서 · STUDIO BODA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Customer-facing printable quote. Lives outside the /me layout so the portal
// chrome (nav/header) is excluded from the printed PDF. Ownership is enforced
// by getMyQuote (filters on user_id), so a customer can only print their own.
export default async function CustomerQuotePrintPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getProfile();
  if (!me) redirect(`/login?next=/quote/${params.id}/print`);

  const q = await getMyQuote(me.id, params.id);
  if (!q) notFound();

  const customerName =
    (me.account_type === "business" ? me.company_name : me.name) ||
    me.name ||
    me.company_name ||
    me.email;

  return (
    <div className="bg-ink-5 print:bg-white">
      <PrintBar backHref={`/me/quotes/${q.id}`} backLabel="← 견적 상세로" />
      <QuoteDocument
        quote={q}
        customer={{
          name: customerName,
          company:
            me.account_type === "business" ? me.company_name : null,
          email: me.email,
          phone: me.contact_phone || me.phone,
        }}
      />
    </div>
  );
}
