import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-100 px-6 text-center text-white">
      <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
        404 · Not Found
      </p>
      <h1 className="mt-3 font-display text-[40px] font-extrabold leading-[1.1] tracking-display sm:text-[56px]">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mt-4 max-w-md text-[14px] leading-[1.7] text-ink-30">
        주소가 바뀌었거나 삭제된 페이지일 수 있습니다. 아래에서 다음 단계를
        선택해 주세요.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/" variant="white" size="lg">
          홈으로 돌아가기
        </LinkButton>
        <LinkButton href="/services" variant="ghost-dark" size="lg">
          서비스 둘러보기
        </LinkButton>
        <LinkButton href="/#inquiry" variant="ghost-dark" size="lg">
          문의하기
        </LinkButton>
      </div>
    </main>
  );
}
