import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { MeNav, MeMobileNav } from "@/components/me/MeNav";
import { ToastProvider } from "@/components/admin/Toast";
import { roleLabels } from "@/lib/types/db";

export const dynamic = "force-dynamic";

export default async function MeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/me");

  const displayName = profile.name || profile.email.split("@")[0];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-ink-5 pb-16 lg:pb-0">
        <header className="border-b border-ink-15 bg-white">
          <div className="mx-auto flex h-16 max-w-[1100px] items-center gap-4 px-5 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-display text-[14px] font-extrabold tracking-tight text-ink-100"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-iris">
                <span className="font-display text-[11px] font-bold text-white">
                  B
                </span>
              </span>
              STUDIO BODA
            </Link>
            <div className="ml-auto flex items-center gap-2.5">
              <div className="hidden text-right sm:block">
                <p
                  className="max-w-[180px] truncate font-display text-[12.5px] font-semibold text-ink-100"
                  title={profile.email}
                >
                  {displayName}
                </p>
                <p className="text-[10px] uppercase tracking-caption text-ink-50">
                  {profile.account_type === "business" ? "Business" : "Individual"}
                  {" · "}
                  {roleLabels[profile.role]}
                </p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-ink-15 px-3 py-1.5 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
          <MeNav />
        </header>

        <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <MeMobileNav />
      </div>
    </ToastProvider>
  );
}
