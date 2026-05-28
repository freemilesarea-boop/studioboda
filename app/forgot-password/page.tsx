import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-ink-100 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-iris-grad opacity-25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-iris-grad opacity-15 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-[760px] grid-cols-1 items-center gap-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-iris-glow/40 bg-iris/[0.18] px-3 py-1.5 backdrop-blur-sm">
            <span className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-iris-glow">
              Reset password
            </span>
          </div>
          <h1 className="mt-5 font-display text-[30px] font-extrabold leading-[1.15] tracking-display text-white sm:text-[36px]">
            가입하신 이메일을 입력해주세요
          </h1>
          <p className="mt-3 max-w-[440px] text-[14px] leading-body text-ink-30">
            비밀번호 재설정 링크를 보내드립니다. 메일이 도착하지 않으면 스팸함을 확인해주세요.
          </p>
        </div>

        <div className="rounded-[20px] border border-ink-90 bg-ink-90/40 p-5 backdrop-blur-sm sm:p-6">
          <ForgotForm />
          <p className="mt-6 border-t border-ink-90 pt-4 text-[11px] text-ink-50">
            계정이 기억나셨다면{" "}
            <Link href="/login" className="font-bold text-iris-glow hover:text-white">
              로그인
            </Link>
            으로 이동하세요. 처음이라면{" "}
            <Link href="/signup" className="font-bold text-iris-glow hover:text-white">
              회원가입
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
