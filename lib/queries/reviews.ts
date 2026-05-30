import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Review } from "@/lib/types/db";

const safeAdmin = () => {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
};

export async function listApprovedReviews(opts?: {
  featuredOnly?: boolean;
  limit?: number;
}): Promise<Review[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  let q = admin
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts?.featuredOnly) q = q.eq("is_featured", true);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []) as Review[];
}

export async function reviewStats(): Promise<{ count: number; average: number }> {
  const admin = safeAdmin();
  if (!admin) return { count: 0, average: 0 };
  const { data } = await admin
    .from("reviews")
    .select("rating")
    .eq("status", "approved")
    .is("deleted_at", null);
  const rows = (data ?? []) as Array<{ rating: number }>;
  if (rows.length === 0) return { count: 0, average: 0 };
  const sum = rows.reduce((a, r) => a + (r.rating ?? 0), 0);
  return { count: rows.length, average: Math.round((sum / rows.length) * 10) / 10 };
}

export async function listMyReviews(userId: string): Promise<Review[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("reviews")
    .select("*")
    .eq("author_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as Review[];
}

export async function adminListReviews(status?: string): Promise<Review[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  let q = admin
    .from("reviews")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []) as Review[];
}
