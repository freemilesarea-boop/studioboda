import { createAdminSupabase } from "@/lib/supabase/admin";
import type { PortfolioItem, PortfolioStatus } from "@/lib/types/db";

// Tolerate missing env at build/SSR time — pages render an empty state
// instead of crashing.
const safeAdmin = () => {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
};

export async function listPublishedPortfolio(opts?: {
  featuredOnly?: boolean;
  limit?: number;
}): Promise<PortfolioItem[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  let q = admin
    .from("portfolio_items")
    .select("*")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false });
  if (opts?.featuredOnly) q = q.eq("is_featured", true);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []) as PortfolioItem[];
}

export async function getPortfolioBySlug(
  slug: string,
): Promise<PortfolioItem | null> {
  const admin = safeAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("portfolio_items")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as PortfolioItem | null) ?? null;
}

export async function adminListPortfolio(opts?: {
  status?: PortfolioStatus | "all";
  featured?: boolean | "all";
  search?: string;
}): Promise<PortfolioItem[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  let q = admin
    .from("portfolio_items")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });
  if (opts?.status && opts.status !== "all") {
    q = q.eq("status", opts.status);
  }
  if (opts?.featured === true || opts?.featured === false) {
    q = q.eq("is_featured", opts.featured);
  }
  if (opts?.search?.trim()) {
    const s = opts.search.trim();
    q = q.or(
      `title.ilike.%${s}%,brand_name.ilike.%${s}%,client_name.ilike.%${s}%,service_type.ilike.%${s}%,category.ilike.%${s}%,slug.ilike.%${s}%`,
    );
  }
  const { data } = await q;
  return (data ?? []) as PortfolioItem[];
}

export async function adminGetPortfolio(
  id: string,
): Promise<PortfolioItem | null> {
  const admin = safeAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("portfolio_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as PortfolioItem | null) ?? null;
}
