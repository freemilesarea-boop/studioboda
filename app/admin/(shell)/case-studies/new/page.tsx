import Link from "next/link";
import { AdminCard } from "@/components/admin/Card";
import { requireStaff } from "@/lib/auth";
import { CaseStudyForm } from "../CaseStudyForm";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 새 성공사례",
  robots: { index: false, follow: false },
};

export default async function NewCaseStudyPage() {
  await requireStaff();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href="/admin/case-studies" className="hover:text-iris">
          ← 성공사례
        </Link>
      </div>
      <div>
        <h2 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
          새 성공사례 작성
        </h2>
        <p className="mt-1 text-[12.5px] text-ink-50">
          기본 정보를 입력해 사례를 생성합니다. /case-studies에 노출됩니다.
        </p>
      </div>
      <AdminCard title="기본 정보">
        <CaseStudyForm />
      </AdminCard>
    </div>
  );
}
