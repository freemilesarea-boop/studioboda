import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { BrandProfile } from "@/lib/types/db";
import { BrandForm } from "./BrandForm";

export const metadata: Metadata = {
  title: "브랜드 정보",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MyBrandPage() {
  const me = await getProfile();
  if (!me) return null;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("brand_profiles")
    .select("*")
    .eq("user_id", me.id)
    .maybeSingle();
  const bp = (data ?? null) as BrandProfile | null;

  return (
    <div className="space-y-5">
      <header>
        <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
          Brand
        </p>
        <h1 className="mt-1 font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
          브랜드 정보
        </h1>
        <p className="mt-1 text-[12px] text-ink-50">
          여기에 적어두시면 새 견적·제작이 들어올 때마다 운영팀이 자동으로 톤·금지 표현·자주 쓰는 문구를 참고합니다.
        </p>
      </header>

      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <BrandForm initial={bp} ownerMode />
      </section>
    </div>
  );
}
