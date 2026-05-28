import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createNotification, notifyStaff } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

const ONE_DAY = 24 * 60 * 60 * 1000;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

type Outcome = {
  ok: true;
  ranAt: string;
  quoteExpiringSoon: number;
  quoteExpired: number;
  projectDueSoon: number;
  paymentReminders: number;
};

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest): Promise<NextResponse<Outcome | { ok: false; error: string }>> {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminSupabase();
  const now = Date.now();
  const in24h = new Date(now + ONE_DAY).toISOString();
  const nowIso = new Date(now).toISOString();
  const since24h = new Date(now - ONE_DAY).toISOString();

  const [
    { data: expiringSoon },
    { data: expired },
    { data: dueSoon },
    { data: pendingPayments },
  ] = await Promise.all([
    admin
      .from("quotes")
      .select("id,title,user_id,expires_at")
      .in("status", ["sent", "customer_review"])
      .not("expires_at", "is", null)
      .gt("expires_at", nowIso)
      .lte("expires_at", in24h),
    admin
      .from("quotes")
      .select("id,title,user_id,expires_at,status")
      .in("status", ["sent", "customer_review"])
      .not("expires_at", "is", null)
      .lte("expires_at", nowIso),
    admin
      .from("projects")
      .select("id,project_no,title,user_id,assigned_to,due_date,status")
      .not("due_date", "is", null)
      .gte("due_date", nowIso.slice(0, 10))
      .lte("due_date", in24h.slice(0, 10))
      .not("status", "in", "(delivered,completed,cancelled)"),
    admin
      .from("payments")
      .select("id,type,title,amount,quote_id,project_id,user_id,created_at")
      .eq("status", "pending")
      .lte("created_at", since24h),
  ]);

  let qSoon = 0;
  for (const q of expiringSoon ?? []) {
    await createNotification(q.user_id, "quote_expiring_soon", {
      quote_id: q.id,
      title: q.title,
      expires_at: q.expires_at,
    });
    qSoon++;
  }

  let qExp = 0;
  for (const q of expired ?? []) {
    await admin.from("quotes").update({ status: "expired" }).eq("id", q.id);
    await createNotification(q.user_id, "quote_expired", {
      quote_id: q.id,
      title: q.title,
    });
    await logActivity({
      entity_type: "quote",
      entity_id: q.id,
      action: "quote_expired_auto",
      metadata: { source: "cron" },
    });
    qExp++;
  }

  let dSoon = 0;
  for (const p of dueSoon ?? []) {
    await createNotification(p.assigned_to ?? p.user_id, "project_due_soon", {
      project_id: p.id,
      project_no: p.project_no,
      title: p.title,
      due_date: p.due_date,
    });
    if (!p.assigned_to) {
      await notifyStaff("project_due_soon", {
        project_id: p.id,
        project_no: p.project_no,
        title: p.title,
        due_date: p.due_date,
      });
    }
    dSoon++;
  }

  let pRem = 0;
  for (const r of pendingPayments ?? []) {
    await createNotification(r.user_id, "payment_reminder", {
      payment_id: r.id,
      title: r.title,
      amount: r.amount,
      type: r.type,
      quote_id: r.quote_id,
      project_id: r.project_id,
    });
    pRem++;
  }

  await logActivity({
    entity_type: "system",
    action: "cron_ops_run",
    metadata: {
      quote_expiring_soon: qSoon,
      quote_expired: qExp,
      project_due_soon: dSoon,
      payment_reminder: pRem,
    },
  });

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    quoteExpiringSoon: qSoon,
    quoteExpired: qExp,
    projectDueSoon: dSoon,
    paymentReminders: pRem,
  });
}
