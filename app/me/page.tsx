import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { getProfile } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logoutAction } from "@/lib/actions/auth";
import type { Inquiry, Profile } from "@/lib/types/db";
import { inquiryStatusLabels, roleLabels } from "@/lib/types/db";

export const metadata: Metadata = {
  title: "마이페이지",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<Inquiry["status"], string> = {
  new: "bg-iris/15 text-iris",
  contacted: "bg-sky/15 text-sky",
  quoted: "bg-warning/15 text-warning",
  converted: "bg-success/15 text-success",
  archived: "bg-ink-5 text-ink-70",
};

export default async function MePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/me");

  const admin = createAdminSupabase();
  const { data: inquiries } = await admin
    .from("inquiries")
    .select("*")
    .or(`user_id.eq.${profile.id},email.ilike.${profile.email}`)
    .order("created_at", { ascending: false })
    .limit(30);

  const myInquiries = (inquiries ?? []) as Inquiry[];

  return (
    <div className="bg-ink-5 min-h-screen">
      <header className="border-b border-ink-15 bg-white">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="font-display text-[14px] font-bold tracking-tight text-ink-100">
            STUDIO BODA
          </Link>
          <div className="flex items-center gap-3 text-[12.5px]">
            <Link href="/" className="text-ink-70 hover:text-ink-100">
              메인
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-ink-15 px-3 py-1.5 font-display font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5 py-8 lg:px-8 lg:py-10">
        <section>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-iris">
            My page
          </p>
          <h1 className="mt-1 font-display text-[24px] font-extrabold tracking-[-0.5px] text-ink-100 sm:text-[28px]">
            안녕하세요, {profile.name || profile.email.split("@")[0]} 님
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-50">
            {profile.account_type === "business" ? "사업자 회원" : "일반 회원"} ·{" "}
            {roleLabels[profile.role]}
          </p>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <ProfileCard profile={profile} />
          <ActionCard />
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[16px] font-extrabold tracking-[-0.3px] text-ink-100">
              내 문의{" "}
              <span className="num ml-1 text-[12px] font-bold text-ink-50">
                {myInquiries.length}
              </span>
            </h2>
            <Link
              href="/#inquiry"
              className="text-[12.5px] font-semibold text-iris hover:opacity-80"
            >
              새 문의 작성하기 →
            </Link>
          </div>

          {myInquiries.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-ink-15 bg-white px-5 py-10 text-center">
              <i className="ti ti-mood-empty text-[24px] text-ink-30" aria-hidden />
              <p className="mt-2 font-display text-[13px] font-bold text-ink-100">
                아직 접수된 문의가 없습니다
              </p>
              <p className="mt-1 text-[12px] text-ink-50">
                메인 페이지의 견적 폼에서 첫 문의를 시작해보세요.
              </p>
              <Link
                href="/#inquiry"
                className="mt-4 inline-flex h-9 items-center rounded-lg bg-ink-100 px-4 font-display text-[12px] font-bold text-white hover:bg-ink-90"
              >
                견적 문의 →
              </Link>
            </div>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {myInquiries.map((i) => (
                <li
                  key={i.id}
                  className="flex items-start gap-3 rounded-2xl border border-ink-15 bg-white px-4 py-3.5 sm:px-5"
                >
                  <span
                    className={`mt-0.5 rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_TONE[i.status]}`}
                  >
                    {inquiryStatusLabels[i.status]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[13px] font-bold text-ink-100">
                      {i.service_type || "(서비스 미선택)"}
                      {i.budget_range ? (
                        <span className="ml-2 text-[11.5px] font-medium text-ink-50">
                          · 예산 {i.budget_range}
                        </span>
                      ) : null}
                    </p>
                    {i.message ? (
                      <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-[12.5px] leading-[1.55] text-ink-70">
                        {i.message}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[11px] text-ink-50">
                      접수{" "}
                      {formatDistanceToNow(new Date(i.created_at), {
                        locale: ko,
                        addSuffix: true,
                      })}{" "}
                      ·{" "}
                      <span className="num">
                        {format(new Date(i.created_at), "yyyy-MM-dd HH:mm")}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const items =
    profile.account_type === "business"
      ? [
          { k: "상호명", v: profile.company_name },
          { k: "대표자", v: profile.representative_name },
          { k: "사업자등록번호", v: profile.business_registration_number },
          { k: "담당자", v: profile.contact_name },
          { k: "담당자 전화", v: profile.contact_phone },
          { k: "업종", v: profile.industry },
          { k: "사업장 주소", v: profile.business_address },
        ]
      : [
          { k: "이름", v: profile.name },
          { k: "전화번호", v: profile.phone },
          { k: "생년월일", v: profile.birth_date },
          { k: "주소", v: profile.address },
        ];

  return (
    <article className="rounded-2xl border border-ink-15 bg-white p-5 lg:col-span-2">
      <header className="flex items-center justify-between border-b border-ink-15 pb-3">
        <p className="font-display text-[12.5px] font-bold text-ink-100">계정 정보</p>
        <span className="rounded-full bg-ink-5 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-ink-70">
          {profile.account_type === "business" ? "Business" : "Individual"}
        </span>
      </header>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <Row label="이메일" value={profile.email} />
        <Row label="아이디" value={profile.username} />
        {items.map((it) => (
          <Row key={it.k} label={it.k} value={it.v} />
        ))}
      </dl>
      <p className="mt-4 text-[11px] text-ink-50">
        정보 수정이 필요하면 hello@studioboda.kr 로 알려주세요. (셀프 수정 기능은 추후 제공)
      </p>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-ink-15/60 py-1.5 last:border-b-0">
      <dt className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </dt>
      <dd className="text-[13px] text-ink-100">{value || "—"}</dd>
    </div>
  );
}

function ActionCard() {
  return (
    <aside className="flex flex-col rounded-2xl border border-iris/30 bg-iris-light p-5">
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-iris">
        Quick start
      </p>
      <p className="mt-1.5 font-display text-[14px] font-bold leading-[1.4] text-ink-100">
        지금 바로 견적 요청을 시작하거나
        <br />
        진행 상태를 확인해보세요.
      </p>
      <div className="mt-4 grid gap-2">
        <Link
          href="/#inquiry"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-ink-100 font-display text-[12.5px] font-bold text-white hover:bg-ink-90"
        >
          새 견적 요청
        </Link>
        <Link
          href="/#pricing"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-ink-15 bg-white font-display text-[12.5px] font-bold text-ink-100 hover:border-ink-30"
        >
          요금제 보기
        </Link>
      </div>
    </aside>
  );
}
