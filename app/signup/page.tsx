import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SignupTabs } from "./SignupTabs";

export const metadata: Metadata = {
  title: "회원가입",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <section className="relative min-h-screen overflow-hidden bg-ink-100 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-iris-grad opacity-25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-iris-grad opacity-15 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-[1100px] grid-cols-1 items-start gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5 lg:sticky lg:top-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-iris-glow/40 bg-iris/[0.18] px-3 py-1.5 shadow-[0_0_0_1px_rgba(140,124,255,0.06),0_8px_24px_-12px_rgba(91,71,255,0.55)] backdrop-blur-sm">
            <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center text-iris-glow live-ring">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-iris-glow" />
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-iris-glow">
              STUDIO BODA · Sign up
            </span>
          </div>

          <p className="mt-6 font-display text-[11px] font-bold uppercase tracking-eyebrow text-white/55">
            See it. Make it. Ship it tomorrow.
          </p>

          <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.8px] text-white sm:text-[42px] lg:text-[44px]">
            STUDIO BODA에서
            <br />
            <span className="bg-iris-text bg-clip-text text-transparent [-webkit-background-clip:text]">
              브랜드 운영
            </span>
            을 시작하세요
          </h1>

          <p className="mt-4 max-w-[420px] text-[14px] leading-[1.65] text-ink-30 sm:text-[15px]">
            일반 회원과 사업자 회원으로 가입할 수 있습니다. 가입 후 견적 요청, 진행 상태,
            결과물 공유를 한 곳에서 관리하세요.
          </p>

          <ul className="mt-7 hidden flex-col gap-2 sm:flex">
            <Step
              icon="ti-user"
              label="일반 회원"
              desc="개인 크리에이터·스타트업 담당자·셀러"
            />
            <Step
              icon="ti-building"
              label="사업자 회원"
              desc="상호명·사업자등록번호·담당자 정보로 가입"
            />
            <Step
              icon="ti-shield-lock"
              label="안전한 저장"
              desc="비밀번호는 Supabase Auth로 해시 저장"
            />
          </ul>

          <p className="mt-7 text-[12px] text-ink-30">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-bold text-iris-glow hover:text-white">
              로그인 →
            </Link>
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-[20px] border border-ink-90 bg-ink-90/40 p-5 backdrop-blur-sm sm:p-6">
            <SignupTabs />
          </div>
          <p className="mt-5 text-center font-mono text-[10px] tracking-wide text-ink-50 sm:text-left">
            © 2026 Studio BODA · contact@swk.today
          </p>
        </div>
      </div>
    </section>
  );
}

function Step({
  icon,
  label,
  desc,
}: {
  icon: string;
  label: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-ink-90 bg-ink-100/60 px-3.5 py-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-iris/20">
        <i className={`ti ${icon} text-[13px] text-iris-glow`} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-display text-[13px] font-bold text-white">{label}</p>
        <p className="mt-0.5 text-[11px] text-ink-30">{desc}</p>
      </div>
    </li>
  );
}
