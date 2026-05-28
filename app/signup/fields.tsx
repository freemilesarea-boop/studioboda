"use client";

import type { ReactNode } from "react";

export const fieldCls =
  "h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-[13.5px] text-white outline-none transition-colors placeholder:text-ink-50 focus:border-iris-glow/60 disabled:opacity-60";

export const labelCls =
  "mb-1.5 block font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-30";

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelCls}>
        {label}
        {required ? <span className="ml-1 text-iris-glow">*</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[10.5px] text-ink-50">{hint}</span>
      ) : null}
    </label>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-[12px] text-error">
      {message}
    </p>
  );
}

export function FieldSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[12px] text-success">
      {message}
    </p>
  );
}

export function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-white font-display text-[13px] font-bold text-ink-100 transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? pendingLabel : label} {pending ? null : "→"}
    </button>
  );
}

export function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-hidden
      className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
    />
  );
}
