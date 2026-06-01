import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { ConsentForm } from "./ConsentForm";

export const metadata: Metadata = {
  title: "알림 수신 설정",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NotificationConsentPage() {
  const me = await getProfile();
  if (!me) redirect("/login?next=/me/notifications/settings");

  // Read current consent + phone from the profile.
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("email, email_opt_in, kakao_opt_in, phone, contact_phone")
    .eq("id", me.id)
    .maybeSingle();
  const phone = (data?.contact_phone || data?.phone || "").trim();

  return (
    <div className="space-y-5">
      <Link
        href="/me/notifications"
        className="inline-flex items-center gap-1 text-[12px] text-ink-50 hover:text-iris"
      >
        ← 알림
      </Link>
      <header>
        <h1 className="font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
          알림 수신 설정
        </h1>
        <p className="mt-1 text-[12px] text-ink-50">
          계약·결제·프로젝트 진행 알림을 어떤 채널로 받을지 선택하세요. 웹 알림은 항상
          제공됩니다.
        </p>
      </header>

      <ConsentForm
        email={data?.email ?? me.email}
        emailOptIn={data?.email_opt_in !== false}
        kakaoOptIn={data?.kakao_opt_in === true}
        phone={phone}
      />
    </div>
  );
}
