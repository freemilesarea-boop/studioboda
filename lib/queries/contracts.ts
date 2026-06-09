import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Contract, ContractVersion } from "@/lib/types/db";

// Tolerate missing env / not-yet-applied migration so SSR never 500s.
const safeAdmin = () => {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
};

export async function listMyContracts(userId: string): Promise<Contract[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("contracts")
    .select("*")
    .eq("client_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as Contract[];
}

export async function getMyContract(
  userId: string,
  id: string,
): Promise<Contract | null> {
  const admin = safeAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("contracts")
    .select("*")
    .eq("id", id)
    .eq("client_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data ?? null) as Contract | null;
}

export async function adminListContracts(opts?: {
  status?: string;
}): Promise<
  Array<Contract & { client_email: string | null; client_name: string | null }>
> {
  const admin = safeAdmin();
  if (!admin) return [];
  let q = admin
    .from("contracts")
    .select("*, client:client_id(email, name, company_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status);
  const { data } = await q;
  return (data ?? []).map((row) => {
    const client = (row as {
      client: { email: string | null; name: string | null; company_name: string | null } | null;
    }).client;
    return {
      ...(row as Contract),
      client_email: client?.email ?? null,
      client_name: client?.name ?? client?.company_name ?? null,
    };
  });
}

export async function adminGetContract(id: string): Promise<{
  contract: Contract & { client_email: string | null; client_name: string | null };
  versions: ContractVersion[];
} | null> {
  const admin = safeAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("contracts")
    .select("*, client:client_id(email, name, company_name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const client = (data as {
    client: { email: string | null; name: string | null; company_name: string | null } | null;
  }).client;
  const { data: versions } = await admin
    .from("contract_versions")
    .select("*")
    .eq("contract_id", id)
    .order("version", { ascending: false });
  return {
    contract: {
      ...(data as Contract),
      client_email: client?.email ?? null,
      client_name: client?.name ?? client?.company_name ?? null,
    },
    versions: (versions ?? []) as ContractVersion[],
  };
}

/**
 * Most recent successful "계약서 사본" email send time for a contract, derived
 * from the notification_deliveries audit (no write to the contract itself).
 */
export async function getContractCopyLastSentAt(
  contractId: string,
): Promise<string | null> {
  const admin = safeAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("notification_deliveries")
    .select("created_at")
    .eq("event_type", "contract_copy_sent")
    .eq("status", "sent")
    .contains("metadata", { contract_id: contractId })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.created_at as string | null) ?? null;
}

export type ContractDepositInfo = {
  status: "paid" | "pending" | "none";
  amount: number | null;
  payUrl: string | null;
  paidAt: string | null;
};

/**
 * Read the deposit (예약금) payment tied to a contract's quote, for display on
 * the customer/admin contract detail. Read-only; does not create a charge.
 */
export async function getContractDepositInfo(
  quoteId: string | null,
): Promise<ContractDepositInfo> {
  if (!quoteId) return { status: "none", amount: null, payUrl: null, paidAt: null };
  const admin = safeAdmin();
  if (!admin) return { status: "none", amount: null, payUrl: null, paidAt: null };
  const { data } = await admin
    .from("payments")
    .select("status, amount, payapp_payurl, paid_at")
    .eq("quote_id", quoteId)
    .eq("type", "deposit")
    .in("status", ["pending", "paid"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return { status: "none", amount: null, payUrl: null, paidAt: null };
  return {
    status: data.status === "paid" ? "paid" : "pending",
    amount: (data.amount as number | null) ?? null,
    payUrl: (data.payapp_payurl as string | null) ?? null,
    paidAt: (data.paid_at as string | null) ?? null,
  };
}
