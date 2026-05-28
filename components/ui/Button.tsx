import Link from "next/link";
import { forwardRef } from "react";
import type { ComponentProps, ReactNode } from "react";

type Variant =
  | "primary"
  | "cinematic"
  | "ghost-cinematic"
  | "white"
  | "dark"
  | "outline"
  | "subtle"
  | "ghost-light"
  | "ghost-dark";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

const base =
  "group inline-flex items-center justify-center gap-2 font-display font-bold tracking-tight transition-[opacity,background,border,color,transform] duration-150 select-none active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:pointer-events-none";

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[12px] rounded-lg",
  md: "h-10 px-5 text-[13px] rounded-lg",
  lg: "h-12 px-7 text-[15px] rounded-xl",
};

const variants: Record<Variant, string> = {
  primary: "bg-iris text-white hover:opacity-90",
  cinematic: "btn-primary-cinematic text-white",
  "ghost-cinematic": "btn-ghost-cinematic text-white",
  white: "bg-white text-iris hover:opacity-90",
  dark: "bg-ink-100 text-white hover:bg-ink-90",
  outline:
    "bg-white text-ink-70 border border-ink-15 hover:border-ink-30 hover:text-ink-100",
  subtle:
    "bg-ink-5 text-ink-100 border border-ink-15 hover:border-iris hover:text-iris",
  "ghost-light":
    "bg-white/[0.08] text-white border border-white/[0.12] hover:bg-white/[0.14]",
  "ghost-dark":
    "bg-transparent text-ink-70 hover:bg-ink-5 hover:text-ink-100",
};

type ButtonProps = BaseProps & ComponentProps<"button">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

type LinkButtonProps = BaseProps &
  Omit<ComponentProps<typeof Link>, "className" | "children">;

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function ArrowGlyph({ className = "" }: { className?: string }) {
  return (
    <span
      className={`transition-transform duration-150 group-hover:translate-x-0.5 ${className}`}
      aria-hidden
    >
      →
    </span>
  );
}
