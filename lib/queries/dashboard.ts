import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Payment, Project, Inquiry } from "@/lib/types/db";

type Row = Pick<
  Payment,
  "type" | "status" | "amount" | "paid_at" | "created_at"
>;

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfMonths = (n: number) => {
  const d = startOfMonth();
  d.setMonth(d.getMonth() - (n - 1));
  return d;
};

export async function dashboardKpis() {
  const admin = createAdminSupabase();

  const mStart = startOfMonth().toISOString();
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixMonthsAgo = startOfMonths(6).toISOString();

  const [
    payRes,
    inqRes,
    projRes,
    quotesRes,
    paymentsRes,
  ] = await Promise.all([
    admin
      .from("payments")
      .select("type,status,amount,paid_at,created_at,quote_id"),
    admin.from("inquiries").select("id,status,created_at"),
    admin
      .from("projects")
      .select(
        "id,status,billing_status,created_at,updated_at,due_date,service_type",
      ),
    admin.from("quotes").select("id,status,total_price,service_type,created_at"),
    admin
      .from("payments")
      .select("amount,paid_at,type,status,created_at,quote_id")
      .gte("created_at", sixMonthsAgo),
  ]);

  const payments = (payRes.data ?? []) as Row[];
  const inquiries = (inqRes.data ?? []) as Pick<
    Inquiry,
    "id" | "status" | "created_at"
  >[];
  const projects = (projRes.data ?? []) as Pick<
    Project,
    | "id"
    | "status"
    | "billing_status"
    | "created_at"
    | "updated_at"
    | "due_date"
    | "service_type"
  >[];
  const quotes = (quotesRes.data ?? []) as {
    id: string;
    status: string;
    total_price: number;
    service_type: string | null;
    created_at: string;
  }[];
  const paymentsRecent = (paymentsRes.data ?? []) as Row[];

  const sum = (
    rows: Row[],
    pred: (r: Row) => boolean,
  ): number => rows.filter(pred).reduce((s, r) => s + (r.amount ?? 0), 0);

  const paidThisMonth = sum(
    payments,
    (r) =>
      r.status === "paid" && !!r.paid_at && r.paid_at >= mStart,
  );
  const depositPaidTotal = sum(
    payments,
    (r) => r.status === "paid" && r.type === "deposit",
  );
  const balancePaidTotal = sum(
    payments,
    (r) => r.status === "paid" && r.type === "balance",
  );
  const pendingTotal = sum(payments, (r) => r.status === "pending");

  // Conversion funnel (overall, lifetime)
  const totalInquiries = inquiries.length;
  const totalQuotes = quotes.length;
  const totalConverted = payments.filter(
    (p) => p.status === "paid" && p.type === "deposit",
  ).length;

  // Avg project duration (completed only): completed projects where
  // status='completed' and updated_at - created_at
  const completed = projects.filter((p) => p.status === "completed");
  const avgDurationDays =
    completed.length === 0
      ? 0
      : Math.round(
          completed.reduce(
            (s, p) =>
              s +
              (new Date(p.updated_at).getTime() -
                new Date(p.created_at).getTime()),
            0,
          ) /
            completed.length /
            (24 * 60 * 60 * 1000),
        );

  // 30-day revenue by day (paid_at)
  const dailyMap: Record<string, number> = {};
  for (const r of payments) {
    if (r.status !== "paid" || !r.paid_at) continue;
    if (r.paid_at < thirtyAgo) continue;
    const day = r.paid_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + (r.amount ?? 0);
  }
  const dailyRevenue: { day: string; amount: number }[] = [];
  const cursor = new Date(thirtyAgo);
  for (let i = 0; i < 30; i++) {
    const day = cursor.toISOString().slice(0, 10);
    dailyRevenue.push({ day, amount: dailyMap[day] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Payment status distribution (count)
  const paymentStatusDist = ["pending", "paid", "failed", "cancelled", "refunded"]
    .map((s) => ({ status: s, count: payments.filter((p) => p.status === s).length }));

  // Project status distribution
  const projectStatusList: Array<Project["status"]> = [
    "queued",
    "briefing",
    "ai_draft",
    "designing",
    "review",
    "revision",
    "delivered",
    "completed",
    "cancelled",
  ];
  const projectStatusDist = projectStatusList.map((s) => ({
    status: s,
    count: projects.filter((p) => p.status === s).length,
  }));

  // Revenue by service (paid only, last 6 months)
  const serviceRevenue: Record<string, number> = {};
  for (const r of paymentsRecent) {
    if (r.status !== "paid") continue;
    const q = quotes.find((x) => x.id === (r as { quote_id?: string }).quote_id);
    const key = q?.service_type || "기타";
    serviceRevenue[key] = (serviceRevenue[key] ?? 0) + (r.amount ?? 0);
  }
  const revenueByService = Object.entries(serviceRevenue)
    .map(([service, amount]) => ({ service, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  return {
    counts: {
      activeProjects: projects.filter(
        (p) =>
          !["delivered", "completed", "cancelled"].includes(p.status),
      ).length,
      completedProjects: completed.length,
      newInquiries: inquiries.filter((i) => i.status === "new").length,
    },
    revenue: {
      paidThisMonth,
      depositPaidTotal,
      balancePaidTotal,
      pendingTotal,
    },
    avgDurationDays,
    funnel: {
      inquiries: totalInquiries,
      quotes: totalQuotes,
      converted: totalConverted,
      i2q:
        totalInquiries === 0 ? 0 : Math.round((totalQuotes / totalInquiries) * 100),
      q2p:
        totalQuotes === 0 ? 0 : Math.round((totalConverted / totalQuotes) * 100),
    },
    dailyRevenue,
    paymentStatusDist,
    projectStatusDist,
    revenueByService,
  };
}
