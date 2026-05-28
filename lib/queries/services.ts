import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  PRIMARY_SERVICE_KEYS,
  type Service,
  type ServiceOption,
} from "@/lib/types/db";

// All public-catalog queries — tolerate missing env (returns empty arrays) so
// that builds and SSR renders never crash. Pages render an empty/placeholder
// state in that case instead of 500.
const safeAdmin = () => {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
};

export async function listActiveServices(): Promise<Service[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as Service[];
}

const isPrimary = (s: Service) =>
  (PRIMARY_SERVICE_KEYS as readonly string[]).includes(s.key);

export async function listPrimaryServices(): Promise<Service[]> {
  return (await listActiveServices()).filter(isPrimary);
}

export async function listSecondaryServices(): Promise<Service[]> {
  return (await listActiveServices()).filter((s) => !isPrimary(s));
}

export async function getServiceByKey(key: string): Promise<Service | null> {
  const admin = safeAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("services")
    .select("*")
    .eq("key", key)
    .eq("active", true)
    .maybeSingle();
  return (data ?? null) as Service | null;
}

export async function listGlobalOptions(): Promise<ServiceOption[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("service_options")
    .select("*")
    .is("service_id", null)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as ServiceOption[];
}

export async function listServiceOptions(
  serviceId: string,
): Promise<ServiceOption[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("service_options")
    .select("*")
    .or(`service_id.eq.${serviceId},service_id.is.null`)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as ServiceOption[];
}
