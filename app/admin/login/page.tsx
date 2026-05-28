import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin · 로그인",
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
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
              STUDIO BODA · Studio OS
            </span>
          </div>

          <p className="mt-6 font-display text-[11px] font-bold uppercase tracking-eyebrow text-white/55">
            See it. Make it. Ship it tomorrow.
          </p>

          <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.8px] text-white sm:text-[42px] lg:text-[46px]">
            관리자 로그인
            <br />
            <span className="bg-iris-text bg-clip-text text-transparent [-webkit-background-clip:text]">
              운영 콘솔
            </span>
            로 입장
          </h1>

          <p className="mt-4 max-w-[440px] text-[14px] leading-[1.65] text-ink-30 sm:text-[15px]">
            문의 · 견적 · 프로젝트 · 파일을 한 화면에서 운영합니다. 승인된 관리자만 접근할
            수 있으며, 본 페이지는 검색에 노출되지 않습니다.
          </p>

          <ul className="mt-7 hidden flex-col gap-2 sm:flex">
            <Step n="01" label="인증" desc="이메일·비밀번호 + Supabase Auth 세션" />
            <Step n="02" label="권한 확인" desc="role ∈ admin/manager/designer 만 허용" />
            <Step n="03" label="운영 대시보드" desc="문의 큐 · 진행 프로젝트 · 활동 로그" />
          </ul>

          <div className="mt-7 hidden flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-30 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <i className="ti ti-shield-check text-[14px] text-sky" aria-hidden />
              SSL · RLS 보호
            </span>
            <span className="h-3 w-px bg-white/[0.08]" />
            <span className="inline-flex items-center gap-1.5">
              <i className="ti ti-eye-off text-[14px] text-sky" aria-hidden />
              noindex
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
                  Admin Sign-in
                </p>
              </div>
              <span className="num font-mono text-[10px] text-ink-50">
                STAFF · ONLY
              </span>
            </div>

            <div className="mt-4">
              <LoginForm next={searchParams.next} />
            </div>

            <p className="mt-6 border-t border-ink-90 pt-4 text-[10.5px] leading-[1.6] text-ink-50">
              관리자 계정이 없으시다면 운영 책임자에게 초대를 요청하거나, 서버에서{" "}
              <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[10px] text-ink-30">
                npm run create-admin
              </code>
              으로 발급해주세요.
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

function Step({ n, label, desc }: { n: string; label: string; desc: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-ink-90 bg-ink-100/60 px-3.5 py-2.5">
      <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-md bg-iris/20 font-display text-[11px] font-bold text-iris-glow">
        {n}
      </span>
      <div className="min-w-0">
        <p className="font-display text-[13px] font-bold text-white">{label}</p>
        <p className="mt-0.5 text-[11px] text-ink-30">{desc}</p>
      </div>
    </li>
  );
}
