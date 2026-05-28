import type { HTMLAttributes, ReactNode } from "react";

type Tone = "light" | "dark" | "soft";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: Tone;
  hoverable?: boolean;
};

const toneClasses: Record<Tone, string> = {
  light: "bg-white border border-ink-15 text-ink-100",
  soft: "bg-ink-5 border border-ink-15 text-ink-100",
  dark: "bg-ink-100 border border-ink-90 text-white",
};

export function Card({
  children,
  className = "",
  tone = "light",
  hoverable = false,
  ...rest
}: CardProps) {
  return (
    <div
      className={`relative rounded-2xl ${toneClasses[tone]} ${
        hoverable
          ? "transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-iris"
          : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
