import { createAdminSupabase } from "@/lib/supabase/admin";
import { ledgerStatusFromRows, type QuotePaymentStatus } from "@/lib/payments/status";
import type { CrmActivity, LeadStatus } from "@/lib/types/db";

const safeAdmin = () => {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
};

export type LeadCard = {
  id: string;
  name: string;
  company: string | null;
  service_type: string | null;
  lead_status: LeadStatus;
  estimated_amount: number | null;
  last_activity_at: string | null;
  created_at: string;
  // Phase 7-2 enrichment (실원장 기준):
  payment_status: QuotePaymentStatus | null;
  project_id: string | null;
  project_no: string | null;
};

export async function listLeads(): Promise<LeadCard[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("inquiries")
    .select(
      "id, name, company, service_type, lead_status, estimated_amount, last_activity_at, created_at",
    )
    .is("deleted_at", null)
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);
  const inquiries = (data ?? []) as Array<Omit<LeadCard, "payment_status" | "project_id" | "project_no">>;
  if (inquiries.length === 0) return [];

  // ── enrich: inquiry → quote(s) → 실원장 결제상태 + 프로젝트 ──
  const inqIds = inquiries.map((i) => i.id);
  const { data: quoteRows } = await admin
    .from("quotes")
    .select("id, inquiry_id")
    .in("inquiry_id", inqIds);
  const quotes = (quoteRows ?? []) as Array<{ id: string; inquiry_id: string | null }>;
  const quoteIds = quotes.map((q) => q.id);

  const [{ data: payRows }, { data: projRows }] = await Promise.all([
    quoteIds.length
      ? admin.from("payments").select("quote_id, type, status").in("quote_id", quoteIds)
      : Promise.resolve({ data: [] as Array<{ quote_id: string; type: string; status: string }> }),
    quoteIds.length
      ? admin.from("projects").select("id, project_no, quote_id").in("quote_id", quoteIds)
      : Promise.resolve({ data: [] as Array<{ id: string; project_no: string; quote_id: string }> }),
  ]);

  const payByQuote = new Map<string, Array<{ type: string; status: string }>>();
  for (const p of (payRows ?? []) as Array<{ quote_id: string; type: string; status: string }>) {
    const arr = payByQuote.get(p.quote_id) ?? [];
    arr.push({ type: p.type, status: p.status });
    payByQuote.set(p.quote_id, arr);
  }
  const projByQuote = new Map<string, { id: string; project_no: string }>();
  for (const pr of (projRows ?? []) as Array<{ id: string; project_no: string; quote_id: string }>) {
    if (!projByQuote.has(pr.quote_id)) projByQuote.set(pr.quote_id, { id: pr.id, project_no: pr.project_no });
  }
  const quotesByInquiry = new Map<string, string[]>();
  for (const q of quotes) {
    if (!q.inquiry_id) continue;
    const arr = quotesByInquiry.get(q.inquiry_id) ?? [];
    arr.push(q.id);
    quotesByInquiry.set(q.inquiry_id, arr);
  }

  return inquiries.map((i) => {
    const qids = quotesByInquiry.get(i.id) ?? [];
    // 프로젝트가 연결된 견적을 우선, 없으면 첫 견적.
    const quoteId = qids.find((q) => projByQuote.has(q)) ?? qids[0] ?? null;
    const proj = quoteId ? projByQuote.get(quoteId) ?? null : null;
    const payment_status: QuotePaymentStatus | null = quoteId
      ? ledgerStatusFromRows(payByQuote.get(quoteId) ?? [])
      : null;
    return {
      ...i,
      payment_status,
      project_id: proj?.id ?? null,
      project_no: proj?.project_no ?? null,
    };
  });
}

export async function listCrmActivities(
  inquiryId: string,
): Promise<CrmActivity[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("crm_activities")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as CrmActivity[];
}
