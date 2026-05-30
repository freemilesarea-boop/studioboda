import { createAdminSupabase } from "@/lib/supabase/admin";
import type { CaseStudy, CaseStudySection } from "@/lib/types/db";

const safeAdmin = () => {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
};

export async function listPublishedCaseStudies(opts?: {
  featuredOnly?: boolean;
  limit?: number;
}): Promise<CaseStudy[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  let q = admin
    .from("case_studies")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false });
  if (opts?.featuredOnly) q = q.eq("is_featured", true);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []) as CaseStudy[];
}

export async function getCaseStudyBySlug(slug: string): Promise<{
  caseStudy: CaseStudy;
  sections: CaseStudySection[];
} | null> {
  const admin = safeAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("case_studies")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  const { data: sections } = await admin
    .from("case_study_sections")
    .select("*")
    .eq("case_study_id", (data as CaseStudy).id)
    .order("sort_order", { ascending: true });
  return {
    caseStudy: data as CaseStudy,
    sections: (sections ?? []) as CaseStudySection[],
  };
}

export async function adminListCaseStudies(): Promise<CaseStudy[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("case_studies")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });
  return (data ?? []) as CaseStudy[];
}

export async function adminGetCaseStudy(id: string): Promise<{
  caseStudy: CaseStudy;
  sections: CaseStudySection[];
} | null> {
  const admin = safeAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("case_studies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { data: sections } = await admin
    .from("case_study_sections")
    .select("*")
    .eq("case_study_id", id)
    .order("sort_order", { ascending: true });
  return {
    caseStudy: data as CaseStudy,
    sections: (sections ?? []) as CaseStudySection[],
  };
}
