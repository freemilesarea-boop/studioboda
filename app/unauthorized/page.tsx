import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

export const metadata = {
  title: "권한 없음",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-100 px-5 text-white">
      <div className="max-w-[420px] text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-iris-glow">
          403 · Unauthorized
        </p>
        <h1 className="mt-3 font-display text-[26px] font-extrabold leading-[1.2] tracking-[-0.6px] sm:text-[30px]">
          관리자 권한이 없습니다
        </h1>
        <p className="mt-3 text-[13px] leading-[1.65] text-ink-30">
          이 페이지는 STUDIO BODA 운영팀에게만 공개됩니다. 잘못 접근하셨다면 메인으로
          돌아가주세요.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-white/15 px-4 text-[12.5px] font-bold text-white hover:bg-white/[0.06]"
          >
            메인으로
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-[12.5px] font-bold text-ink-100 hover:bg-ink-15"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
