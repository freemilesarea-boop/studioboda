import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import { MobileNav } from "@/components/admin/MobileNav";
import { ToastProvider } from "@/components/admin/Toast";
import { getProfile, isStaffRole } from "@/lib/auth";
import { roleLabels, type Organization } from "@/lib/types/db";
import { createAdminSupabase } from "@/lib/supabase/admin";

export default async function ShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");
  if (!isStaffRole(profile.role)) redirect("/unauthorized");

  const admin = createAdminSupabase();
  const { data: orgRows } = await admin
    .from("organizations")
    .select("id,slug,name,display_name,brand_color,active")
    .order("active", { ascending: false })
    .order("name", { ascending: true });
  const orgs = (orgRows ?? []) as Pick<
    Organization,
    "id" | "slug" | "name" | "display_name" | "brand_color" | "active"
  >[];

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-ink-5">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar
            title="STUDIO BODA"
            userName={profile.name || profile.email}
            role={roleLabels[profile.role]}
            orgs={orgs}
          />
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {children}
          </main>
          <MobileNav />
        </div>
      </div>
    </ToastProvider>
  );
}
