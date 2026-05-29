import Link from "next/link";
import { AdminCard } from "@/components/admin/Card";
import { PortfolioForm } from "../PortfolioForm";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 새 포트폴리오",
  robots: { index: false, follow: false },
};

export default function NewPortfolioPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href="/admin/portfolio" className="hover:text-iris">
          ← 포트폴리오
        </Link>
      </div>
      <div>
        <h2 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
          새 포트폴리오 케이스
        </h2>
        <p className="mt-1 text-[12.5px] text-ink-50">
          먼저 기본 정보를 저장한 뒤, 편집 화면에서 썸네일·갤러리·성과 인증을 업로드합니다.
        </p>
      </div>
      <AdminCard title="기본 정보">
        <PortfolioForm />
      </AdminCard>
    </div>
  );
}
