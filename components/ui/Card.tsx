import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hoverable?: boolean;
};

export function Card({
  children,
  className = "",
  hoverable = false,
  ...rest
}: CardProps) {
  return (
    <div
      className={`relative rounded-3xl border border-ink-15 bg-white shadow-soft ${
        hoverable
          ? "transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-ink-30 hover:shadow-lift"
          : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`meta ${className}`}>{children}</div>;
}
