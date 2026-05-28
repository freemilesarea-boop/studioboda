import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; signup?: string };
}) {
  const user = await getSessionUser();
  if (user) redirect(searchParams.next || "/");

  return (
    <section className="relative min-h-screen overflow-hidden bg-ink-100 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-iris-grad opacity-25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-iris-grad opacity-15 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-[1080px] grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-iris-glow/40 bg-iris/[0.18] px-3 py-1.5 shadow-[0_0_0_1px_rgba(140,124,255,0.06),0_8px_24px_-12px_rgba(91,71,255,0.55)] backdrop-blur-sm">
            <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center text-iris-glow live-ring">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-iris-glow" />
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-iris-glow">
              STUDIO BODA · Sign in
            </span>
          </div>

          <p className="mt-6 font-display text-[11px] font-bold uppercase tracking-eyebrow text-white/55">
            See it. Make it. Ship it tomorrow.
          </p>

          <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.8px] text-white sm:text-[42px] lg:text-[46px]">
            다시 만나서{" "}
            <span className="bg-iris-text bg-clip-text text-transparent [-webkit-background-clip:text]">
              반갑습니다
            </span>
          </h1>

          <p className="mt-4 max-w-[440px] text-[14px] leading-[1.65] text-ink-30 sm:text-[15px]">
            이메일 또는 아이디로 로그인하실 수 있습니다. STUDIO BODA 계정 하나로 견적·프로젝트
            상태를 확인하고 콘텐츠 운영을 시작하세요.
          </p>

          <div className="mt-7 hidden flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-30 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <i className="ti ti-shield-check text-[14px] text-sky" aria-hidden />
              SSL · 암호화 저장
            </span>
            <span className="h-3 w-px bg-white/[0.08]" />
            <Link href="/" className="hover:text-white">
              ← 메인으로
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-[20px] border border-ink-90 bg-ink-90/40 p-5 backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-ink-90 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-iris">
                  <span className="font-display text-[11px] font-bold text-white">
                    B
                  </span>
                </span>
                <p className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30">
                  Sign in
                </p>
              </div>
              <Link
                href="/signup"
                className="font-display text-[10.5px] font-bold uppercase tracking-eyebrow text-iris-glow hover:text-white"
              >
                회원가입 →
              </Link>
            </div>

            <div className="mt-4">
              <LoginForm next={searchParams.next} />
            </div>

            {searchParams.signup === "1" ? (
              <p className="mt-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[12px] text-success">
                회원가입이 완료되었습니다. 아래에서 로그인해주세요.
              </p>
            ) : null}

            <p className="mt-6 border-t border-ink-90 pt-4 text-[10.5px] leading-[1.6] text-ink-50">
              STUDIO BODA 관리자라면{" "}
              <Link href="/admin/login" className="text-iris-glow hover:text-white">
                관리자 로그인
              </Link>
              으로 이동해주세요.
            </p>
          </div>

          <p className="mt-5 text-center font-mono text-[10px] tracking-wide text-ink-50 sm:text-left">
            © 2026 Studio BODA · hello@studioboda.kr
          </p>
        </div>
      </div>
    </section>
  );
}
