import type { Metadata } from "next";
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
    <div className="min-h-screen bg-ink-100 text-white">
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col items-stretch justify-center px-5 py-12">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-iris">
            <span className="font-display text-[12px] font-bold text-white">
              B
            </span>
          </span>
          <span className="font-display text-[14px] font-bold tracking-tight text-white">
            STUDIO BODA <span className="text-ink-30">Admin</span>
          </span>
        </div>

        <h1 className="font-display text-[26px] font-extrabold leading-[1.2] tracking-[-0.6px] text-white sm:text-[30px]">
          관리자 로그인
        </h1>
        <p className="mt-2 text-[13px] leading-[1.6] text-ink-30">
          승인된 관리자만 접근할 수 있습니다.
        </p>

        <LoginForm next={searchParams.next} />

        <p className="mt-8 text-[11px] text-ink-50">
          © 2026 Studio BODA · 본 페이지는 검색에서 노출되지 않습니다.
        </p>
      </div>
    </div>
  );
}
