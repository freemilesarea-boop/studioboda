import type {
  BillingStatus,
  InquiryStatus,
  ProjectStatus,
  QuoteStatus,
  Priority,
} from "@/lib/types/db";
import {
  inquiryStatusLabels,
  projectStatusLabels,
  quoteStatusLabels,
  priorityLabels,
} from "@/lib/types/db";

export const billingStatusToneClass: Record<BillingStatus, string> = {
  waiting_deposit: "text-warning",
  in_progress: "text-iris",
  waiting_balance: "text-warning",
  completed: "text-success",
};

type BaseProps = { className?: string };

const tone = {
  iris: "bg-iris/10 text-iris",
  sky: "bg-sky/10 text-sky",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/10 text-error",
  neutral: "bg-ink-5 text-ink-70",
} as const;

const inquiryTone: Record<InquiryStatus, keyof typeof tone> = {
  new: "iris",
  contacted: "sky",
  quoted: "warning",
  converted: "success",
  in_progress: "iris",
  completed: "success",
  archived: "neutral",
};

const quoteTone: Record<QuoteStatus, keyof typeof tone> = {
  draft: "neutral",
  sent: "sky",
  customer_review: "warning",
  accepted: "success",
  rejected: "error",
  expired: "warning",
};

const projectTone: Record<ProjectStatus, keyof typeof tone> = {
  queued: "neutral",
  briefing: "iris",
  ai_draft: "iris",
  designing: "sky",
  review: "warning",
  revision: "warning",
  delivered: "success",
  completed: "success",
  cancelled: "error",
};

const priorityTone: Record<Priority, keyof typeof tone> = {
  low: "neutral",
  normal: "sky",
  high: "warning",
  urgent: "error",
};

const base =
  "inline-flex items-center rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em]";

export function InquiryStatusBadge({
  status,
  className = "",
}: BaseProps & { status: InquiryStatus }) {
  return (
    <span className={`${base} ${tone[inquiryTone[status]]} ${className}`}>
      {inquiryStatusLabels[status]}
    </span>
  );
}

export function QuoteStatusBadge({
  status,
  className = "",
}: BaseProps & { status: QuoteStatus }) {
  return (
    <span className={`${base} ${tone[quoteTone[status]]} ${className}`}>
      {quoteStatusLabels[status]}
    </span>
  );
}

export function ProjectStatusBadge({
  status,
  className = "",
}: BaseProps & { status: ProjectStatus }) {
  return (
    <span className={`${base} ${tone[projectTone[status]]} ${className}`}>
      {projectStatusLabels[status]}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className = "",
}: BaseProps & { priority: Priority }) {
  return (
    <span className={`${base} ${tone[priorityTone[priority]]} ${className}`}>
      {priorityLabels[priority]}
    </span>
  );
}
