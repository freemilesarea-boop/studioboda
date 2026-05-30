import { getProfile } from "@/lib/auth";
import { listMyReviews } from "@/lib/queries/reviews";
import { type Review, reviewStatusLabels } from "@/lib/types/db";
import { MyReviewForm } from "./MyReviewForm";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "내 후기 · STUDIO BODA",
  robots: { index: false, follow: false },
};

const statusTone: Record<Review["status"], string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-iris/10 text-iris",
  rejected: "bg-error/10 text-error",
  hidden: "bg-ink-15 text-ink-60",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-iris" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <i
          key={i}
          className={
            i < rating ? "ti ti-star-filled" : "ti ti-star text-ink-15"
          }
        />
      ))}
    </span>
  );
}

export default async function MyReviewsPage() {
  const me = await getProfile();
  if (!me) return null;
  const reviews = await listMyReviews(me.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[22px] font-extrabold tracking-display text-ink-100">
          내 후기
        </h1>
        <p className="mt-1 text-[13px] text-ink-60">
          작성하신 후기와 승인 상태를 확인하세요.
        </p>
      </div>

      <div className="rounded-2xl border border-ink-15 bg-white p-6">
        <h2 className="font-display text-[15px] font-bold tracking-display text-ink-100">
          새 후기 작성
        </h2>
        <MyReviewForm />
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-ink-15 bg-white p-6 text-center text-[13px] text-ink-60">
            아직 작성한 후기가 없습니다.
          </p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-ink-15 bg-white p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <Stars rating={review.rating} />
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone[review.status]}`}
                >
                  {reviewStatusLabels[review.status]}
                </span>
              </div>
              {review.title && (
                <h3 className="mt-3 font-display text-[14px] font-bold text-ink-100">
                  {review.title}
                </h3>
              )}
              <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink-70">
                {review.body}
              </p>
              <p className="mt-3 text-[11px] text-ink-60">
                {new Date(review.created_at).toLocaleDateString("ko-KR")}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
