"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReviewAction } from "@/lib/actions/reviews";

export function ReviewForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    if (body.trim().length < 10) {
      setMessage({ tone: "error", text: "후기는 10자 이상 작성해주세요" });
      return;
    }
    const formData = new FormData();
    formData.set("rating", String(rating));
    formData.set("title", title);
    formData.set("body", body);

    startTransition(async () => {
      const res = await submitReviewAction(formData);
      if (res.ok) {
        setMessage({
          tone: "success",
          text: "후기가 등록되었습니다. 운영팀 승인 후 공개됩니다.",
        });
        setRating(5);
        setTitle("");
        setBody("");
        router.refresh();
      } else {
        setMessage({ tone: "error", text: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink-70">
          평점
        </label>
        <div className="inline-flex items-center gap-1 text-[22px]">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            const active = (hover || rating) >= value;
            return (
              <button
                key={value}
                type="button"
                aria-label={`${value}점`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                className={active ? "text-iris" : "text-ink-15"}
              >
                <i className="ti ti-star-filled" aria-hidden />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink-70">
          제목 (선택)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-ink-15 px-3 py-2 text-[13px]"
          placeholder="후기 제목"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink-70">
          후기 내용
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={10}
          rows={4}
          className="w-full rounded-lg border border-ink-15 px-3 py-2 text-[13px]"
          placeholder="STUDIO BODA와의 작업 경험을 들려주세요 (10자 이상)"
        />
      </div>

      {message && (
        <p
          className={
            message.tone === "success"
              ? "text-[13px] text-iris"
              : "text-[13px] text-error"
          }
        >
          {message.text}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ink-100 px-3 py-1.5 font-display text-[12px] font-bold text-white disabled:opacity-50"
        >
          {pending ? "등록 중…" : "후기 등록"}
        </button>
        <span className="text-[12px] text-ink-60">
          작성하신 후기는 운영팀 승인 후 공개됩니다
        </span>
      </div>
    </form>
  );
}
