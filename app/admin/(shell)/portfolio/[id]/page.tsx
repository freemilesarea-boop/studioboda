import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCard } from "@/components/admin/Card";
import { adminGetPortfolio } from "@/lib/queries/portfolio";
import { portfolioStatusLabels } from "@/lib/types/db";
import { PortfolioForm } from "../PortfolioForm";
import { PortfolioAssets } from "./PortfolioAssets";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 포트폴리오 편집",
  robots: { index: false, follow: false },
};

export default async function EditPortfolioPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await adminGetPortfolio(params.id);
  if (!item) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href="/admin/portfolio" className="hover:text-iris">
          ← 포트폴리오
        </Link>
        <span className="text-ink-30">·</span>
        <span className="font-mono text-[11px]">{item.slug}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
            {item.title}
          </h2>
          <p className="mt-1 text-[12.5px] text-ink-50">
            상태 · {portfolioStatusLabels[item.status]}
            {item.is_featured ? " · Featured" : ""}
          </p>
        </div>
        {item.status === "published" ? (
          <Link
            href={`/portfolio/${item.slug}`}
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
        <PortfolioForm item={item} />
      </AdminCard>

      <AdminCard title="이미지 · 인증 자산">
        <PortfolioAssets item={item} />
      </AdminCard>
    </div>
  );
}
