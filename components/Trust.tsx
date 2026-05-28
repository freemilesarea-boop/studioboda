import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { trustStats, reviews, type Review } from "@/lib/site-data";

export function Trust() {
  return (
    <section className="section bg-ink-5" id="trust">
      <SectionHeader
        eyebrow="Trust"
        title="숫자로 증명되는 결과"
        subtitle="320개 이상 브랜드와 함께 만든 2,400건의 콘텐츠. 결과는 데이터로 남깁니다."
      />

      <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {trustStats.map((s, i) => {
          const accent = i % 2 === 1 ? "text-electric" : "text-iris";
          return (
            <Reveal key={s.label} delay={i * 0.04}>
              <div className="card-cinematic group rounded-2xl border border-ink-15 bg-white p-5">
                <p className="num font-display text-[34px] font-extrabold leading-none tracking-[-1px] text-ink-100 sm:text-[42px]">
                  {s.num}
                  <span className={accent}>{s.suffix}</span>
                </p>
                <div className="mt-3 h-px w-8 bg-ink-15 transition-colors duration-300 group-hover:bg-electric/50" />
                <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-50">
                  {s.label}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-12 columns-1 gap-3 sm:columns-2 lg:columns-3">
        {reviews.map((r, i) => (
          <Reveal key={r.initials + r.industry} delay={i * 0.04}>
            <ReviewCard review={r} highlight={i === 0 || i === 3} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ReviewCard({
  review,
  highlight,
}: {
  review: Review;
  highlight?: boolean;
}) {
  return (
    <article
      className={`mb-3 inline-block w-full break-inside-avoid rounded-[16px] border bg-white px-5 py-5 transition-colors duration-200 ${
        highlight ? "border-ink-30" : "border-ink-15"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-iris-light font-display text-[12px] font-bold text-iris">
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-display text-[13px] font-bold text-ink-100">
              {review.initials}
            </span>
            {review.verified && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-success"
                title="실제 클라이언트 동의 하에 공개된 리뷰"
              >
                <i className="ti ti-circle-check text-[12px]" aria-hidden />
                Verified
              </span>
            )}
            {review.repeat && review.repeat > 1 && (
              <span className="rounded-full bg-iris-light px-1.5 py-0.5 text-[9px] font-bold text-iris">
                Repeat · {review.repeat}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-ink-50">{review.role}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-ink-50">
            <span className="font-display font-bold uppercase tracking-[0.08em] text-ink-70">
              {review.industry}
            </span>
            <span className="text-ink-30">·</span>
            <span className="num">{review.scale}</span>
          </div>
        </div>
        <span className="rounded-full bg-ink-5 px-2 py-0.5 text-[10px] font-bold text-ink-70">
          {review.badge}
        </span>
      </div>

      <p className="mt-3 text-[12.5px] leading-[1.7] text-ink-70">
        “{review.body}”
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-ink-15 pt-3">
        <p className="num text-[11px] font-bold text-warning">
          ★★★★★ {review.rating}
        </p>
        <p className="text-[10px] text-ink-50">{review.timestamp}</p>
      </div>
    </article>
  );
}
