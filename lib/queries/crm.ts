import { createAdminSupabase } from "@/lib/supabase/admin";
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
  return (data ?? []) as LeadCard[];
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
