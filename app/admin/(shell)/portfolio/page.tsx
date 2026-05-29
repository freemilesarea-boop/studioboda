import Link from "next/link";
import { format } from "date-fns";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import { adminListPortfolio } from "@/lib/queries/portfolio";
import {
  portfolioStatusLabels,
  type PortfolioStatus,
} from "@/lib/types/db";
import { PortfolioRowActions } from "./PortfolioRowActions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 포트폴리오",
  robots: { index: false, follow: false },
};

const STATUS_OPTIONS: { value: PortfolioStatus | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "published", label: "공개" },
  { value: "draft", label: "초안" },
  { value: "archived", label: "보관" },
];

export default async function AdminPortfolioListPage({
  searchParams,
}: {
  searchParams?: { status?: string; featured?: string; q?: string };
}) {
  const status =
    (searchParams?.status as PortfolioStatus | "all" | undefined) ?? "all";
  const featuredRaw = searchParams?.featured ?? "all";
  const featured: boolean | "all" =
    featuredRaw === "true" ? true : featuredRaw === "false" ? false : "all";
  const q = (searchParams?.q ?? "").trim();

  const items = await adminListPortfolio({ status, featured, search: q });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
            포트폴리오
          </h2>
          <p className="mt-1 text-[12.5px] text-ink-50">
            랜딩 · /portfolio · /portfolio/[slug]에 노출되는 케이스를 운영합니다.
          </p>
        </div>
        <Link
          href="/admin/portfolio/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-ink-100 px-4 font-display text-[13px] font-bold text-white hover:bg-ink-90"
        >
          <i className="ti ti-plus text-[15px]" aria-hidden />새 케이스
        </Link>
      </div>

      <AdminCard
        title="필터"
        action={
          <span className="text-[11px] text-ink-50">총 {items.length}건</span>
        }
      >
        <form method="get" className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((o) => {
              const qs = new URLSearchParams();
              if (o.value !== "all") qs.set("status", o.value);
              if (featured !== "all") qs.set("featured", String(featured));
              if (q) qs.set("q", q);
              const href = qs.toString() ? `?${qs}` : "?";
              return (
                <a
                  key={o.value}
                  href={href}
                  className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
                    status === o.value
                      ? "border-ink-100 bg-ink-100 text-white"
                      : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
                  }`}
                >
                  {o.label}
                </a>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: "all", label: "전부" },
              { value: "true", label: "Featured" },
              { value: "false", label: "Featured 제외" },
            ].map((o) => {
              const qs = new URLSearchParams();
              if (status !== "all") qs.set("status", status);
              if (o.value !== "all") qs.set("featured", o.value);
              if (q) qs.set("q", q);
              const href = qs.toString() ? `?${qs}` : "?";
              const active = featuredRaw === o.value;
              return (
                <a
                  key={o.value}
                  href={href}
                  className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
                    active
                      ? "border-iris bg-iris text-white"
                      : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
                  }`}
                >
                  {o.label}
                </a>
              );
            })}
          </div>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="제목 · 브랜드 · 카테고리 검색"
            className="ml-auto h-9 w-full rounded-md border border-ink-15 bg-white px-3 text-[12.5px] outline-none focus:border-iris/60 sm:w-60"
          />
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          {featuredRaw !== "all" ? <input type="hidden" name="featured" value={featuredRaw} /> : null}
          <button
            type="submit"
            className="h-9 rounded-md bg-ink-100 px-3 font-display text-[12px] font-bold text-white hover:bg-ink-90"
          >
            검색
          </button>
        </form>
      </AdminCard>

      <AdminCard title="목록">
        {items.length === 0 ? (
          <EmptyState
            title="조건에 맞는 케이스가 없습니다"
            description="필터를 조정하거나 새 케이스를 등록해주세요."
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
                      className="ti ti-photo text-[18px] text-ink-30"
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
                      {portfolioStatusLabels[it.status]}
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
                    href={`/admin/portfolio/${it.id}`}
                    className="mt-1 block truncate font-display text-[14px] font-bold text-ink-100 hover:text-iris"
                  >
                    {it.title}
                  </Link>
                  <p className="mt-0.5 truncate text-[12px] text-ink-50">
                    {[it.brand_name, it.client_name, it.service_type, it.category]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <PortfolioRowActions
                  id={it.id}
                  slug={it.slug}
                  status={it.status}
                  featured={it.is_featured}
                />
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
