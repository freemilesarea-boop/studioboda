"use client";

import { useEffect, useState } from "react";

export function MobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > 360 && y < max - 700);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-[140%]"
      }`}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
    >
      <a
        href="#quote"
        className={`pointer-events-auto group flex h-12 items-center justify-between rounded-xl bg-iris px-5 text-white ${
          visible ? "" : "opacity-0"
        }`}
      >
        <span className="text-[14px] font-bold">무료 견적 받기</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-[13px] transition-transform duration-150 group-hover:translate-x-0.5">
          →
        </span>
      </a>
    </div>
  );
}
