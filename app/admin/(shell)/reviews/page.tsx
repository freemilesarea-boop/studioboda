import Link from "next/link";
import { format } from "date-fns";
import { requireStaff } from "@/lib/auth";
import { adminListReviews } from "@/lib/queries/reviews";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import { type Review, type ReviewStatus, reviewStatusLabels } from "@/lib/types/db";
import { ReviewActions } from "./ReviewActions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Reviews",
  robots: { index: false, follow: false },
};

const STATUSES: (ReviewStatus | "all")[] = [
  "all",
  "pending",
  "approved",
  "rejected",
  "hidden",
];

const statusTone: Record<ReviewStatus, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-iris/10 text-iris",
  rejected: "bg-error/10 text-error",
  hidden: "bg-ink-15 text-ink-60",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-warning" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <i
          key={i}
          className={i < rating ? "ti ti-star-filled" : "ti ti-star text-ink-15"}
        />
      ))}
    </span>
  );
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireStaff();

  const status = (
    STATUSES.includes(searchParams.status as ReviewStatus | "all")
      ? searchParams.status
      : "all"
  ) as ReviewStatus | "all";

  const reviews = await adminListReviews(status === "all" ? undefined : status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
            Reviews
          </p>
          <h2 className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.4px] text-ink-100">
            후기 관리
          </h2>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => {
          const active = s === status;
          return (
            <Link
              key={s}
              href={`/admin/reviews${s === "all" ? "" : `?status=${s}`}`}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
                active
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              {s === "all" ? "전체" : reviewStatusLabels[s as ReviewStatus]}
            </Link>
          );
        })}
      </div>

      <AdminCard>
        {reviews.length === 0 ? (
          <EmptyState
            title="후기가 없습니다"
            description="조건에 해당하는 후기가 없습니다."
          />
        ) : (
          <div className="space-y-3">
            {reviews.map((review: Review) => (
              <article
                key={review.id}
                className="rounded-xl border border-ink-15 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Stars rating={review.rating} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone[review.status]}`}
                    >
                      {reviewStatusLabels[review.status]}
                    </span>
                    {review.is_featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-iris/10 px-2 py-0.5 text-[11px] font-semibold text-iris">
                        <i className="ti ti-sparkles" aria-hidden /> 추천
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-ink-50">
                    {format(new Date(review.created_at), "yyyy.MM.dd HH:mm")}
                  </span>
                </div>

                {review.title && (
                  <h3 className="mt-2.5 font-display text-[14px] font-bold text-ink-100">
                    {review.title}
                  </h3>
                )}
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink-70">
                  {review.body}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-ink-15 pt-3">
                  <p className="text-[12px] text-ink-60">
                    <span className="font-semibold text-ink-100">
                      {review.author_name || "익명"}
                    </span>
                    {review.company && <span className="ml-1">· {review.company}</span>}
                  </p>
                  <ReviewActions
                    id={review.id}
                    status={review.status}
                    isFeatured={review.is_featured}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
