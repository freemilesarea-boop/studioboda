import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Payment, PaymentStatus } from "@/lib/types/db";

export async function listMyPayments(userId: string): Promise<Payment[]> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Payment[];
}

export async function getMyPayment(
  userId: string,
  id: string,
): Promise<Payment | null> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("payments")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return (data ?? null) as Payment | null;
}

export async function listAllPayments(
  status?: PaymentStatus,
): Promise<Payment[]> {
  const admin = createAdminSupabase();
  let q = admin
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []) as Payment[];
}

export async function paymentAggregates() {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("payments")
    .select("type,status,amount");
  const rows = (data ?? []) as Pick<Payment, "type" | "status" | "amount">[];
  const sum = (pred: (r: typeof rows[number]) => boolean) =>
    rows.filter(pred).reduce((s, r) => s + (r.amount ?? 0), 0);
  return {
    unpaidTotal: sum((r) => r.status === "pending"),
    pendingDeposits: sum((r) => r.status === "pending" && r.type === "deposit"),
    paidTotal: sum((r) => r.status === "paid"),
    paidCount: rows.filter((r) => r.status === "paid").length,
    pendingCount: rows.filter((r) => r.status === "pending").length,
  };
}
