import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import { MobileNav } from "@/components/admin/MobileNav";
import { ToastProvider } from "@/components/admin/Toast";
import { getProfile, isStaffRole } from "@/lib/auth";
import { roleLabels } from "@/lib/types/db";

export default async function ShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");
  if (!isStaffRole(profile.role)) redirect("/unauthorized");

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-ink-5">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar
            title="STUDIO BODA"
            userName={profile.name || profile.email}
            role={roleLabels[profile.role]}
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
