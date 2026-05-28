import Link from "next/link";
import { forwardRef } from "react";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

const base =
  "group inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-[transform,background,color,box-shadow] duration-200 will-change-transform select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:pointer-events-none";

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm rounded-full",
  md: "h-12 px-5 text-[15px] rounded-full",
  lg: "h-14 px-6 text-base rounded-full",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-ink-100 text-white hover:bg-ink-90 active:scale-[0.98] shadow-soft hover:shadow-lift",
  secondary:
    "bg-white text-ink-100 border border-ink-15 hover:border-ink-30 hover:bg-ink-05 active:scale-[0.98]",
  ghost:
    "bg-transparent text-ink-70 hover:text-ink-100 hover:bg-ink-05 active:scale-[0.98]",
  outline:
    "bg-transparent text-ink-100 border border-ink-100 hover:bg-ink-100 hover:text-white active:scale-[0.98]",
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

export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={`transition-transform duration-200 group-hover:translate-x-0.5 ${className}`}
      aria-hidden
    >
      <path
        d="M2.5 7h9m0 0L8 3.5M11.5 7 8 10.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
