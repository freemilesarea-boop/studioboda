import type { ReactNode } from "react";
import { Reveal } from "./ui/Reveal";

type Props = {
  eyebrow: string;
  title: ReactNode;
  desc?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  desc,
  align = "left",
  className = "",
}: Props) {
  return (
    <div
      className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""} ${className}`}
    >
      <Reveal>
        <div className="meta">{eyebrow}</div>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-4 text-balance font-sans text-[32px] font-semibold leading-[1.1] tracking-tightest text-ink-100 sm:text-[44px] lg:text-[52px]">
          {title}
        </h2>
      </Reveal>
      {desc && (
        <Reveal delay={0.12}>
          <p className="mt-5 max-w-2xl text-balance text-base leading-[1.7] text-ink-70 sm:text-lg">
            {desc}
          </p>
        </Reveal>
      )}
    </div>
  );
}
