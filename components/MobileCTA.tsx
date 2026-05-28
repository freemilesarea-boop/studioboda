"use client";

import { useEffect, useState } from "react";
import { ArrowIcon } from "./ui/Button";

export function MobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      // show after Hero, hide near footer/contact
      setVisible(y > 360 && y < max - 600);
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
        href="#contact"
        className={`pointer-events-auto group flex h-14 items-center justify-between rounded-full bg-ink-100 px-6 text-white shadow-lift ${
          visible ? "" : "opacity-0"
        }`}
      >
        <span className="text-[15px] font-medium">프로젝트 문의하기</span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
          <ArrowIcon />
        </span>
      </a>
    </div>
  );
}
