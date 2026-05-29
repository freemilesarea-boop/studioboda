import { createAdminSupabase } from "@/lib/supabase/admin";
import type { PaymentBuyer } from "@/app/admin/(shell)/quotes/[id]/QuotePaymentPanel";

export async function resolveQuoteBuyer(quoteId: string): Promise<PaymentBuyer> {
  const admin = createAdminSupabase();
  const empty: PaymentBuyer = {
    linked: false,
    source: "none",
    name: null,
    email: null,
    phone: null,
  };

  const { data: quote } = await admin
    .from("quotes")
    .select("id,user_id,inquiry_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) return empty;

  let userId: string | null = (quote.user_id as string | null) ?? null;
  let source: PaymentBuyer["source"] = userId ? "quote" : "none";
  let name = "";
  let email = "";
  let phone = "";

  // linked project
  if (!userId) {
    const { data: project } = await admin
      .from("projects")
      .select("user_id")
      .eq("quote_id", quoteId)
      .maybeSingle();
    if (project?.user_id) {
      userId = project.user_id as string;
      source = "project";
    }
  }

  // inquiry
  let inquiryEmail: string | null = null;
  if (quote.inquiry_id) {
    const { data: inq } = await admin
      .from("inquiries")
      .select("name,email,phone,user_id")
      .eq("id", quote.inquiry_id)
      .maybeSingle();
    if (inq) {
      name = inq.name ?? "";
      email = inq.email ?? "";
      phone = inq.phone ?? "";
      inquiryEmail = inq.email ?? null;
      if (!userId && inq.user_id) {
        userId = inq.user_id as string;
        source = "inquiry";
      }
    }
  }

  // last-resort: profiles by email
  if (!userId && inquiryEmail) {
    const { data: prof } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", inquiryEmail)
      .maybeSingle();
    if (prof?.id) {
      userId = prof.id as string;
      source = "profiles_email";
    }
  }

  if (!userId) {
    return { ...empty, name: name || null, email: email || null, phone: phone || null };
  }

  // pull the authoritative profile snapshot
  const { data: profile } = await admin
    .from("profiles")
    .select("name,email,phone,contact_phone,company_name")
    .eq("id", userId)
    .maybeSingle();
  if (profile) {
    name = profile.name || profile.company_name || name;
    email = profile.email || email;
    phone = profile.phone || profile.contact_phone || phone;
  }

  return {
    linked: true,
    source,
    name: name || null,
    email: email || null,
    phone: phone || null,
  };
}
