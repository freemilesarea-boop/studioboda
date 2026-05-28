import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  await requireStaff();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to"); // YYYY-MM-DD
  const type = searchParams.get("type"); // deposit|balance|extra
  const status = searchParams.get("status"); // pending|paid|failed|cancelled|refunded

  const admin = createAdminSupabase();
  let q = admin
    .from("payments")
    .select(
      "id,type,status,amount,quote_id,project_id,user_id,paid_at,payapp_mul_no,created_at,title,description",
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (from) q = q.gte("created_at", `${from}T00:00:00Z`);
  if (to) q = q.lte("created_at", `${to}T23:59:59Z`);
  if (type) q = q.eq("type", type);
  if (status) q = q.eq("status", status);

  const { data } = await q;
  const rows = (data ?? []) as Array<{
    id: string;
    type: string;
    status: string;
    amount: number;
    quote_id: string | null;
    project_id: string | null;
    user_id: string | null;
    paid_at: string | null;
    payapp_mul_no: string | null;
    created_at: string;
    title: string;
    description: string | null;
  }>;

  // Resolve user emails in bulk
  const userIds = Array.from(
    new Set(rows.map((r) => r.user_id).filter((v): v is string => !!v)),
  );
  const emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id,email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      emailMap[(p as { id: string }).id] = (p as { email: string }).email;
    }
  }

  const header = [
    "payment_id",
    "type",
    "status",
    "amount",
    "title",
    "description",
    "quote_id",
    "project_id",
    "user_id",
    "user_email",
    "paid_at",
    "payapp_mul_no",
    "created_at",
  ];

  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.type,
        r.status,
        r.amount,
        r.title,
        r.description ?? "",
        r.quote_id ?? "",
        r.project_id ?? "",
        r.user_id ?? "",
        r.user_id ? emailMap[r.user_id] ?? "" : "",
        r.paid_at ?? "",
        r.payapp_mul_no ?? "",
        r.created_at,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  const csv = "﻿" + lines.join("\n"); // BOM for Excel KR
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payments_${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
