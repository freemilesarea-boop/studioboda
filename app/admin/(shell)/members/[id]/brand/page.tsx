import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { BrandForm } from "@/app/me/brand/BrandForm";
import type { BrandProfile, Profile } from "@/lib/types/db";

export const metadata: Metadata = {
  title: "Admin · 브랜드 자산",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminMemberBrandPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminSupabase();
  const [{ data: profile }, { data: brand }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", params.id).maybeSingle(),
    admin
      .from("brand_profiles")
      .select("*")
      .eq("user_id", params.id)
      .maybeSingle(),
  ]);
  if (!profile) notFound();
  const p = profile as Profile;
  const bp = (brand ?? null) as BrandProfile | null;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/members"
        className="inline-flex items-center gap-1 text-[12px] text-ink-50 hover:text-iris"
      >
        ← 회원 목록
      </Link>

      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
          Brand Profile
        </p>
        <h1 className="mt-1 font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
          {p.company_name || p.name || p.email}
        </h1>
        <p className="mt-1 text-[12px] text-ink-50">
          이 회원의 브랜드 자산. 운영팀이 직접 채워두면 제작 브리프 자동화에 활용됩니다.
        </p>
      </header>

      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <BrandForm initial={bp} userId={p.id} />
      </section>
    </div>
  );
}
