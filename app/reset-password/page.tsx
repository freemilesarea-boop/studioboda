import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "새 비밀번호 설정",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-ink-100 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-iris-grad opacity-25 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-[760px] grid-cols-1 gap-10">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-iris-glow">
            Reset password
          </p>
          <h1 className="mt-3 font-display text-[30px] font-extrabold leading-[1.15] tracking-display text-white sm:text-[36px]">
            새로운 비밀번호를 설정해주세요
          </h1>
          <p className="mt-3 max-w-[440px] text-[14px] leading-body text-ink-30">
            메일 링크로 도달하셨다면 자동으로 인증 세션이 열려 있습니다.
          </p>
        </div>

        <div className="rounded-[20px] border border-ink-90 bg-ink-90/40 p-5 backdrop-blur-sm sm:p-6">
          <ResetForm />
          <p className="mt-6 border-t border-ink-90 pt-4 text-[11px] text-ink-50">
            링크가 만료되었다면{" "}
            <Link
              href="/forgot-password"
              className="font-bold text-iris-glow hover:text-white"
            >
              다시 요청하세요
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
