import type { Metadata } from "next";
import Link from "next/link";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { NewSubscriptionForm } from "./NewSubscriptionForm";

export const metadata: Metadata = {
  title: "새 구독 등록 · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewSubscriptionPage() {
  const admin = createAdminSupabase();
  const { data: members } = await admin
    .from("profiles")
    .select("id, email, name, company_name, phone, contact_phone, account_type")
    .eq("role", "client")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/admin/subscriptions"
          className="text-[12px] font-bold text-ink-50 hover:text-ink-100"
        >
          ← 구독 목록
        </Link>
      </p>

      <header>
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-iris">
          New Subscription
        </p>
        <h1 className="mt-1 font-display text-[24px] font-extrabold tracking-tightish text-ink-100">
          새 구독 등록
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-50">
          고객 + 플랜 + 월 금액을 지정하면 PayApp 자동결제 카드 등록 링크가 발급됩니다.
          고객이 카드 등록을 완료하면 즉시 첫 달 결제가 이뤄지고 매월 같은 날 자동 청구됩니다.
        </p>
      </header>

      <section className="rounded-2xl border border-ink-15 bg-white p-5 sm:p-6">
        <NewSubscriptionForm
          members={(members ?? []).map((m) => ({
            id: m.id as string,
            email: m.email as string,
            name: (m.name ?? m.company_name) as string | null,
            phone: ((m.contact_phone ?? m.phone) as string | null) ?? null,
          }))}
        />
      </section>
    </div>
  );
}
