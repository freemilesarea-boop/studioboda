import { createAdminSupabase } from "@/lib/supabase/admin";
import type {
  Inquiry,
  Profile,
  Project,
  ProjectFile,
  Quote,
} from "@/lib/types/db";

// All customer-scoped reads use service-role internally and explicitly filter
// by user_id. Callers must pass profile.id from getProfile() / requireStaff()
// (never trust query params).

export async function listMyInquiries(userId: string, email: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("inquiries")
    .select("*")
    .or(`user_id.eq.${userId},email.ilike.${email}`)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Inquiry[];
}

export async function getMyInquiry(
  userId: string,
  email: string,
  id: string,
): Promise<Inquiry | null> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("inquiries")
    .select("*")
    .eq("id", id)
    .or(`user_id.eq.${userId},email.ilike.${email}`)
    .maybeSingle();
  return (data ?? null) as Inquiry | null;
}

export async function listMyQuotes(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("quotes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Quote[];
}

export async function getMyQuote(
  userId: string,
  id: string,
): Promise<Quote | null> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("quotes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return (data ?? null) as Quote | null;
}

export async function listMyProjects(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Project[];
}

export async function getMyProject(
  userId: string,
  id: string,
): Promise<Project | null> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return (data ?? null) as Project | null;
}

export async function listClientFiles(projectId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .eq("visibility", "client")
    .order("created_at", { ascending: false });
  return (data ?? []) as ProjectFile[];
}

export type ProjectComment = {
  id: string;
  project_id: string;
  author_id: string | null;
  body: string;
  is_internal: boolean;
  attachments: unknown[];
  created_at: string;
  author?: { name: string | null; role: string; email: string } | null;
};

export async function listClientVisibleComments(projectId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("project_comments")
    .select("*, author:profiles!author_id(name,role,email)")
    .eq("project_id", projectId)
    .eq("is_internal", false)
    .order("created_at", { ascending: false });
  return (data ?? []) as ProjectComment[];
}

export async function getAssignedProfile(
  id: string | null,
): Promise<Pick<Profile, "id" | "name" | "email" | "role"> | null> {
  if (!id) return null;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("id,name,email,role")
    .eq("id", id)
    .maybeSingle();
  return (data ?? null) as
    | Pick<Profile, "id" | "name" | "email" | "role">
    | null;
}

export async function customerDashboardCounts(userId: string) {
  const admin = createAdminSupabase();
  const [active, completed, openQuotes, openInquiries] = await Promise.all([
    admin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", [
        "queued",
        "briefing",
        "ai_draft",
        "designing",
        "review",
        "revision",
      ]),
    admin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["delivered", "completed"]),
    admin
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["sent", "customer_review"]),
    admin
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["new", "contacted"]),
  ]);
  return {
    activeProjects: active.count ?? 0,
    completedProjects: completed.count ?? 0,
    openQuotes: openQuotes.count ?? 0,
    openInquiries: openInquiries.count ?? 0,
  };
}
