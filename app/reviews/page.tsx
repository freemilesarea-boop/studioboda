import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";
import { listApprovedReviews, reviewStats } from "@/lib/queries/reviews";
import { getProfile } from "@/lib/auth";
import { type Review } from "@/lib/types/db";
import { ReviewForm } from "./ReviewForm";

// Dynamic: the page reads the visitor's session (getProfile) to decide whether
// to show the review-writing form, so it cannot be statically prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "고객 후기 · STUDIO BODA",
  description:
    "STUDIO BODA를 경험한 고객들의 생생한 후기를 확인하세요. 평균 평점과 실제 작업 후기를 한눈에 볼 수 있습니다.",
  openGraph: {
    title: "고객 후기 · STUDIO BODA",
    description:
      "STUDIO BODA를 경험한 고객들의 생생한 후기를 확인하세요.",
  },
};

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5 text-iris" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <i
          key={i}
          className={
            i < full ? "ti ti-star-filled" : "ti ti-star text-ink-15"
          }
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex flex-col rounded-2xl border border-ink-15 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        {review.is_featured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-iris/10 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-eyebrow text-iris">
            <i className="ti ti-sparkles" aria-hidden /> 추천
          </span>
        )}
      </div>
      {review.title && (
        <h3 className="mt-3 font-display text-[15px] font-bold tracking-display text-ink-100">
          {review.title}
        </h3>
      )}
      <p className="mt-2 flex-1 whitespace-pre-line text-[14px] leading-relaxed text-ink-70">
        {review.body}
      </p>
      <div className="mt-4 border-t border-ink-15 pt-3 text-[12px] text-ink-60">
        <span className="font-semibold text-ink-100">
          {review.author_name || "익명"}
        </span>
        {review.company && <span className="ml-1">· {review.company}</span>}
      </div>
    </article>
  );
}

export default async function ReviewsPage() {
  const [reviews, stats, me] = await Promise.all([
    listApprovedReviews(),
    reviewStats(),
    getProfile(),
  ]);

  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
            Reviews
          </p>
          <h1 className="mt-2 font-display text-[34px] font-extrabold leading-tight tracking-display text-ink-100 sm:text-[42px]">
            고객 후기
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-ink-70">
            <span className="inline-flex items-center gap-2">
              <Stars rating={stats.average} />
              <span className="font-semibold text-ink-100">
                평균 평점 {stats.average.toFixed(1)} / 5
              </span>
            </span>
            <span>총 {stats.count}개의 후기</span>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-12">
          {reviews.length === 0 ? (
            <p className="rounded-2xl border border-ink-15 bg-white p-8 text-center text-[14px] text-ink-60">
              아직 등록된 후기가 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-20">
          <div className="rounded-2xl border border-ink-15 bg-white p-6">
            <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
              Write a review
            </p>
            <h2 className="mt-2 font-display text-[20px] font-extrabold tracking-display text-ink-100">
              직접 경험을 남겨주세요
            </h2>
            {me ? (
              <ReviewForm />
            ) : (
              <div className="mt-4 text-[14px] text-ink-70">
                <p>후기는 로그인한 고객만 작성할 수 있습니다.</p>
                <Link
                  href="/login?next=/reviews"
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-ink-100 px-3 py-1.5 font-display text-[12px] font-bold text-white"
                >
                  로그인하고 후기 작성
                  <i className="ti ti-arrow-right" aria-hidden />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}
