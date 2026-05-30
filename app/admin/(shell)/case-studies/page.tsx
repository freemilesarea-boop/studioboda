import Link from "next/link";
import { format } from "date-fns";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import { requireStaff } from "@/lib/auth";
import { adminListCaseStudies } from "@/lib/queries/case-studies";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 성공사례",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  published: "공개",
  draft: "초안",
  archived: "보관",
};

export default async function AdminCaseStudiesListPage() {
  await requireStaff();
  const items = await adminListCaseStudies();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
            성공사례
          </h2>
          <p className="mt-1 text-[12.5px] text-ink-50">
            /case-studies · /case-studies/[slug]에 노출되는 사례를 운영합니다.
          </p>
        </div>
        <Link
          href="/admin/case-studies/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-ink-100 px-4 font-display text-[13px] font-bold text-white hover:bg-ink-90"
        >
          <i className="ti ti-plus text-[15px]" aria-hidden />새 사례 작성
        </Link>
      </div>

      <AdminCard
        title="목록"
        action={
          <span className="text-[11px] text-ink-50">총 {items.length}건</span>
        }
      >
        {items.length === 0 ? (
          <EmptyState
            title="등록된 성공사례가 없습니다"
            description="새 사례를 작성해 공개해보세요."
          />
        ) : (
          <ul className="divide-y divide-ink-15">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex flex-wrap items-center gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-ink-15 bg-ink-5">
                  {it.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.thumbnail_url}
                      alt={it.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <i
                      className="ti ti-trophy text-[18px] text-ink-30"
                      aria-hidden
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-50">
                    <span
                      className={`rounded-full px-2 py-0.5 font-display text-[10px] font-bold ${
                        it.status === "published"
                          ? "bg-success/15 text-success"
                          : it.status === "draft"
                          ? "bg-warning/15 text-warning"
                          : "bg-ink-15 text-ink-70"
                      }`}
                    >
                      {STATUS_LABELS[it.status] ?? it.status}
                    </span>
                    {it.is_featured ? (
                      <span className="rounded-full bg-iris/10 px-2 py-0.5 font-display text-[10px] font-bold text-iris">
                        Featured
                      </span>
                    ) : null}
                    <span className="font-mono">{it.slug}</span>
                    <span>· {format(new Date(it.updated_at), "yyyy-MM-dd")}</span>
                  </div>
                  <Link
                    href={`/admin/case-studies/${it.id}`}
                    className="mt-1 block truncate font-display text-[14px] font-bold text-ink-100 hover:text-iris"
                  >
                    {it.title}
                  </Link>
                  <p className="mt-0.5 truncate text-[12px] text-ink-50">
                    {[it.client_name, it.service_type, it.category]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                {it.status === "published" ? (
                  <Link
                    href={`/case-studies/${it.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-ink-15 bg-white px-2.5 text-[11px] font-semibold text-ink-70 hover:border-ink-30 hover:text-ink-100"
                  >
                    <i className="ti ti-external-link text-[12px]" aria-hidden />
                    공개 페이지
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
