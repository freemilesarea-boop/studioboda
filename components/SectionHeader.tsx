import type { ReactNode } from "react";
import { Reveal } from "./ui/Reveal";

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  action?: ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  tone = "light",
  className = "",
  action,
}: Props) {
  const titleColor = tone === "dark" ? "text-white" : "text-ink-100";
  const subColor = tone === "dark" ? "text-ink-30" : "text-ink-50";

  return (
    <div
      className={`flex flex-col gap-6 ${
        align === "center" ? "items-center text-center" : "items-start"
      } md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div className={align === "center" ? "max-w-3xl" : "max-w-2xl"}>
        <Reveal>
          <p className={tone === "dark" ? "eyebrow-light" : "eyebrow"}>
            {eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2
            className={`mt-2.5 font-display text-[28px] font-extrabold leading-[1.2] tracking-[-0.5px] sm:text-[32px] lg:text-[36px] ${titleColor}`}
          >
            {title}
          </h2>
        </Reveal>
        {subtitle && (
          <Reveal delay={0.12}>
            <p
              className={`mt-2.5 max-w-xl text-[14px] leading-[1.65] ${subColor}`}
            >
              {subtitle}
            </p>
          </Reveal>
        )}
      </div>
      {action && (
        <Reveal delay={0.15}>
          <div className="shrink-0">{action}</div>
        </Reveal>
      )}
    </div>
  );
}
