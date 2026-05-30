import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { PrintToolbar } from "./PrintToolbar";
import { QuoteDocument } from "@/components/QuoteDocument";
import type { Quote, Profile, Inquiry } from "@/lib/types/db";

export const metadata: Metadata = {
  title: "견적서 · STUDIO BODA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function QuotePrintPage({
  params,
}: {
  params: { id: string };
}) {
  await requireStaff();
  const admin = createAdminSupabase();
  const { data: quote } = await admin
    .from("quotes")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!quote) notFound();
  const q = quote as Quote;

  let profile: Profile | null = null;
  let inquiry: Inquiry | null = null;
  if (q.user_id) {
    const { data } = await admin
      .from("profiles")
      .select("*")
      .eq("id", q.user_id)
      .maybeSingle();
    profile = (data ?? null) as Profile | null;
  }
  if (q.inquiry_id) {
    const { data } = await admin
      .from("inquiries")
      .select("*")
      .eq("id", q.inquiry_id)
      .maybeSingle();
    inquiry = (data ?? null) as Inquiry | null;
  }

  const customerName =
    profile?.company_name ||
    profile?.name ||
    inquiry?.company ||
    inquiry?.name ||
    "—";
  const customerCompany =
    profile?.account_type === "business" ? profile.company_name : null;
  const customerEmail = profile?.email || inquiry?.email || "—";
  const customerPhone =
    profile?.contact_phone || profile?.phone || inquiry?.phone || "—";

  return (
    <div className="bg-ink-5 print:bg-white">
      <PrintToolbar quoteId={q.id} />
      <QuoteDocument
        quote={q}
        customer={{
          name: customerName,
          company: customerCompany,
          email: customerEmail,
          phone: customerPhone,
        }}
      />
    </div>
  );
}
