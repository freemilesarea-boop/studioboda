import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCard } from "@/components/admin/Card";
import { requireStaff } from "@/lib/auth";
import { adminGetCaseStudy } from "@/lib/queries/case-studies";
import { CaseStudyForm } from "../CaseStudyForm";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 성공사례 편집",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  published: "공개",
  draft: "초안",
  archived: "보관",
};

export default async function EditCaseStudyPage({
  params,
}: {
  params: { id: string };
}) {
  await requireStaff();
  const data = await adminGetCaseStudy(params.id);
  if (!data) notFound();

  const { caseStudy } = data;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href="/admin/case-studies" className="hover:text-iris">
          ← 성공사례
        </Link>
        <span className="text-ink-30">·</span>
        <span className="font-mono text-[11px]">{caseStudy.slug}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
            {caseStudy.title}
          </h2>
          <p className="mt-1 text-[12.5px] text-ink-50">
            상태 · {STATUS_LABELS[caseStudy.status] ?? caseStudy.status}
            {caseStudy.is_featured ? " · Featured" : ""}
          </p>
        </div>
        {caseStudy.status === "published" ? (
          <Link
            href={`/case-studies/${caseStudy.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-15 bg-white px-3 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
          >
            <i className="ti ti-external-link text-[13px]" aria-hidden />
            공개 페이지 열기
          </Link>
        ) : null}
      </div>

      <AdminCard title="기본 정보">
        <CaseStudyForm initial={caseStudy} />
      </AdminCard>
    </div>
  );
}
