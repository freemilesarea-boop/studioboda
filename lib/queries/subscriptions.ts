import { createAdminSupabase } from "@/lib/supabase/admin";
import type {
  Subscription,
  SubscriptionInvoice,
} from "@/lib/types/db";

export async function listMySubscriptions(
  userId: string,
): Promise<Subscription[]> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Subscription[];
}

export async function getMySubscription(
  userId: string,
  id: string,
): Promise<{
  subscription: Subscription;
  invoices: SubscriptionInvoice[];
} | null> {
  const admin = createAdminSupabase();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (!sub) return null;
  const { data: invoices } = await admin
    .from("subscription_invoices")
    .select("*")
    .eq("subscription_id", id)
    .order("created_at", { ascending: false });
  return {
    subscription: sub as Subscription,
    invoices: (invoices ?? []) as SubscriptionInvoice[],
  };
}

export async function listAllSubscriptions(): Promise<
  Array<Subscription & { profile_email: string | null; profile_name: string | null }>
> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("subscriptions")
    .select("*, profile:user_id(email, name, company_name)")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => {
    const profile = (row as { profile: { email: string | null; name: string | null; company_name: string | null } | null }).profile;
    return {
      ...(row as Subscription),
      profile_email: profile?.email ?? null,
      profile_name: profile?.name ?? profile?.company_name ?? null,
    };
  });
}

export async function getSubscriptionAdmin(id: string): Promise<{
  subscription: Subscription & {
    profile_email: string | null;
    profile_name: string | null;
  };
  invoices: SubscriptionInvoice[];
} | null> {
  const admin = createAdminSupabase();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("*, profile:user_id(email, name, company_name)")
    .eq("id", id)
    .maybeSingle();
  if (!sub) return null;
  const profile = (sub as { profile: { email: string | null; name: string | null; company_name: string | null } | null }).profile;
  const { data: invoices } = await admin
    .from("subscription_invoices")
    .select("*")
    .eq("subscription_id", id)
    .order("created_at", { ascending: false });
  return {
    subscription: {
      ...(sub as Subscription),
      profile_email: profile?.email ?? null,
      profile_name: profile?.name ?? profile?.company_name ?? null,
    },
    invoices: (invoices ?? []) as SubscriptionInvoice[],
  };
}
