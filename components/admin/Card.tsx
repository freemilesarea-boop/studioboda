import type { ReactNode } from "react";

export function AdminCard({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-ink-15 bg-white ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-ink-15 px-5 py-3.5">
          {title ? (
            <h2 className="font-display text-[13px] font-bold tracking-[-0.2px] text-ink-100">
              {title}
            </h2>
          ) : null}
          {action ? <div className="text-[12px]">{action}</div> : null}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  trend,
  tone = "default",
}: {
  label: string;
  value: string | number;
  trend?: string;
  tone?: "default" | "iris" | "warning" | "success";
}) {
  const accent: Record<typeof tone, string> = {
    default: "text-ink-100",
    iris: "text-iris",
    warning: "text-warning",
    success: "text-success",
  };
  return (
    <div className="rounded-2xl border border-ink-15 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </p>
      <p
        className={`num mt-2 font-display text-[26px] font-extrabold leading-none tracking-[-0.6px] ${accent[tone]} sm:text-[30px]`}
      >
        {value}
      </p>
      {trend ? (
        <p className="mt-2 text-[11px] text-ink-50">{trend}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon = "ti-mood-empty",
  title,
  description,
}: {
  icon?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <i className={`ti ${icon} text-[28px] text-ink-30`} aria-hidden />
      <p className="font-display text-[14px] font-bold text-ink-100">{title}</p>
      {description ? (
        <p className="max-w-[320px] text-[12.5px] leading-[1.6] text-ink-50">
          {description}
        </p>
      ) : null}
    </div>
  );
}
