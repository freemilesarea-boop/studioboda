import { createAdminSupabase } from "@/lib/supabase/admin";
import type { FaqCategory, FaqItem } from "@/lib/types/db";

const safeAdmin = () => {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
};

export async function listFaqCategories(): Promise<FaqCategory[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("faq_categories")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as FaqCategory[];
}

export async function listFaqItems(): Promise<FaqItem[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("faq_items")
    .select("*")
    .eq("active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  return (data ?? []) as FaqItem[];
}

export async function adminListFaq(): Promise<{
  categories: FaqCategory[];
  items: FaqItem[];
}> {
  const admin = safeAdmin();
  if (!admin) return { categories: [], items: [] };
  const [{ data: cats }, { data: items }] = await Promise.all([
    admin.from("faq_categories").select("*").order("sort_order", { ascending: true }),
    admin
      .from("faq_items")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);
  return {
    categories: (cats ?? []) as FaqCategory[],
    items: (items ?? []) as FaqItem[],
  };
}
