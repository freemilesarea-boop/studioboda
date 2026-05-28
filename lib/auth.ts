import { redirect } from "next/navigation";
import { createServerAuthSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Profile, Role } from "@/lib/types/db";

export async function getSessionUser() {
  const supabase = createServerAuthSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

const STAFF_ROLES: Role[] = ["admin", "manager", "designer"];

export function isStaffRole(role: Role | undefined | null) {
  return role ? STAFF_ROLES.includes(role) : false;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");
  if (!isStaffRole(profile.role)) redirect("/unauthorized");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "admin") redirect("/unauthorized");
  return profile;
}
