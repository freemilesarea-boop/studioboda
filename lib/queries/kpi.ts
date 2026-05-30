import { createAdminSupabase } from "@/lib/supabase/admin";

const safeAdmin = () => {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
};

const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM

function lastMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setMonth(d.getMonth() - i);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export type ExecutiveKpis = {
  inquiriesToday: number;
  inquiriesThisMonth: number;
  quotesThisMonth: number;
  contractConversion: number; // signed / sent contracts (%)
  paymentConversion: number; // paid quotes / total quotes (%)
  activeProjects: number;
  revenueThisMonth: number;
  revenueTotal: number;
  inquiryTrend: Array<{ month: string; count: number }>;
  revenueTrend: Array<{ month: string; amount: number }>;
  contractTrend: Array<{ month: string; rate: number }>;
  recent: Array<{
    kind: "inquiry" | "quote" | "contract" | "payment" | "project";
    id: string;
    label: string;
    at: string;
  }>;
};

export async function executiveKpis(): Promise<ExecutiveKpis> {
  const empty: ExecutiveKpis = {
    inquiriesToday: 0,
    inquiriesThisMonth: 0,
    quotesThisMonth: 0,
    contractConversion: 0,
    paymentConversion: 0,
    activeProjects: 0,
    revenueThisMonth: 0,
    revenueTotal: 0,
    inquiryTrend: [],
    revenueTrend: [],
    contractTrend: [],
    recent: [],
  };
  const admin = safeAdmin();
  if (!admin) return empty;

  const months = lastMonths(6);
  const thisMonth = months[months.length - 1];
  const todayStr = new Date().toISOString().slice(0, 10);
  const ACTIVE = ["briefing", "ai_draft", "designing", "review", "revision"];

  const [inqRes, quoteRes, contractRes, payRes, projRes] = await Promise.all([
    admin.from("inquiries").select("id, name, company, created_at").is("deleted_at", null),
    admin.from("quotes").select("id, title, status, created_at"),
    admin.from("contracts").select("id, contract_number, status, created_at").is("deleted_at", null),
    admin.from("payments").select("id, title, amount, status, paid_at, created_at"),
    admin.from("projects").select("id, title, status, created_at"),
  ]);

  const inquiries = (inqRes.data ?? []) as Array<{ id: string; name: string | null; company: string | null; created_at: string }>;
  const quotes = (quoteRes.data ?? []) as Array<{ id: string; title: string; status: string; created_at: string }>;
  const contracts = (contractRes.data ?? []) as Array<{ id: string; contract_number: string; status: string; created_at: string }>;
  const payments = (payRes.data ?? []) as Array<{ id: string; title: string; amount: number; status: string; paid_at: string | null; created_at: string }>;
  const projects = (projRes.data ?? []) as Array<{ id: string; title: string; status: string; created_at: string }>;

  const inquiriesToday = inquiries.filter((i) => i.created_at.slice(0, 10) === todayStr).length;
  const inquiriesThisMonth = inquiries.filter((i) => monthKey(i.created_at) === thisMonth).length;
  const quotesThisMonth = quotes.filter((q) => monthKey(q.created_at) === thisMonth).length;

  const sentContracts = contracts.filter((c) => c.status !== "draft" && c.status !== "cancelled").length;
  const signedContracts = contracts.filter((c) => c.status === "signed").length;
  const contractConversion = sentContracts === 0 ? 0 : Math.round((signedContracts / sentContracts) * 100);

  const totalQuotes = quotes.length;
  const paidQuoteIds = new Set(payments.filter((p) => p.status === "paid").map(() => true)); // placeholder
  const acceptedQuotes = quotes.filter((q) => q.status === "accepted").length;
  const paymentConversion = totalQuotes === 0 ? 0 : Math.round((acceptedQuotes / totalQuotes) * 100);
  void paidQuoteIds;

  const activeProjects = projects.filter((p) => ACTIVE.includes(p.status)).length;

  const paidPayments = payments.filter((p) => p.status === "paid");
  const revenueTotal = paidPayments.reduce((a, p) => a + (p.amount ?? 0), 0);
  const revenueThisMonth = paidPayments
    .filter((p) => monthKey(p.paid_at ?? p.created_at) === thisMonth)
    .reduce((a, p) => a + (p.amount ?? 0), 0);

  const inquiryTrend = months.map((m) => ({
    month: m,
    count: inquiries.filter((i) => monthKey(i.created_at) === m).length,
  }));
  const revenueTrend = months.map((m) => ({
    month: m,
    amount: paidPayments
      .filter((p) => monthKey(p.paid_at ?? p.created_at) === m)
      .reduce((a, p) => a + (p.amount ?? 0), 0),
  }));
  const contractTrend = months.map((m) => {
    const created = contracts.filter((c) => monthKey(c.created_at) === m && c.status !== "cancelled").length;
    const signed = contracts.filter((c) => monthKey(c.created_at) === m && c.status === "signed").length;
    return { month: m, rate: created === 0 ? 0 : Math.round((signed / created) * 100) };
  });

  const recent: ExecutiveKpis["recent"] = [
    ...inquiries.map((i) => ({
      kind: "inquiry" as const,
      id: i.id,
      label: `문의 · ${i.company || i.name || "익명"}`,
      at: i.created_at,
    })),
    ...quotes.map((q) => ({ kind: "quote" as const, id: q.id, label: `견적 · ${q.title}`, at: q.created_at })),
    ...contracts.map((c) => ({
      kind: "contract" as const,
      id: c.id,
      label: `계약 · ${c.contract_number}`,
      at: c.created_at,
    })),
    ...paidPayments.map((p) => ({ kind: "payment" as const, id: p.id, label: `결제 · ${p.title}`, at: p.paid_at ?? p.created_at })),
    ...projects.map((p) => ({ kind: "project" as const, id: p.id, label: `프로젝트 · ${p.title}`, at: p.created_at })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 18);

  return {
    inquiriesToday,
    inquiriesThisMonth,
    quotesThisMonth,
    contractConversion,
    paymentConversion,
    activeProjects,
    revenueThisMonth,
    revenueTotal,
    inquiryTrend,
    revenueTrend,
    contractTrend,
    recent,
  };
}
