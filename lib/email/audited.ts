// ============================================================
// STUDIO BODA — Audited transactional email
// ============================================================
// Wraps the low-level Resend sender (lib/email/send.ts) so that EVERY
// transactional email attempt — success, failure, or skip — is recorded in
// `notification_deliveries` (channel='email') and surfaced on the admin
// 알림 설정 → 최근 발송 panel. A missing RESEND_API_KEY (the P0 root cause of
// silent email loss) now shows up as a `failed` delivery row with a clear
// reason instead of vanishing into a server log.
//
// This is additive: existing senders keep their own activity logging; routing
// them through `sendAuditedEmail` only ADDS the delivery audit + a uniform
// `email_failed` activity entry. It never throws — auditing must not break the
// customer flow.
// ============================================================

import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { sendTemplate } from "@/lib/email/send";
import type { TemplateName, TemplateMap } from "@/lib/email/templates";

export type EmailParty = "client" | "staff" | "system";
type DeliveryStatus = "sent" | "failed" | "skipped";

export async function recordEmailDelivery(input: {
  userId?: string | null;
  eventType: string;
  status: DeliveryStatus;
  toAddress?: string | null;
  templateCode?: string | null;
  error?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminSupabase();
    await admin.from("notification_deliveries").insert({
      user_id: input.userId ?? null,
      event_type: input.eventType,
      channel: "email",
      status: input.status,
      template_code: input.templateCode ?? null,
      to_address: input.toAddress ?? null,
      error: input.error ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // The audit row is best-effort. A failure here must never bubble up into
    // the caller's flow (e.g. webhook ack, contract send).
  }
}

/**
 * Send a templated email and audit the outcome to notification_deliveries.
 * Returns the same shape as sendTemplate so callers can branch on `.ok`.
 */
export async function sendAuditedEmail<T extends TemplateName>(opts: {
  to: string | null | undefined;
  template: T;
  data: TemplateMap[T];
  /** Logical event for the audit (e.g. "quote_received", "contract_sent"). */
  eventType: string;
  userId?: string | null;
  party?: EmailParty;
}): Promise<{ ok: boolean; error?: string }> {
  const to = (opts.to ?? "").trim();
  const party = opts.party ?? "client";

  if (!to) {
    await recordEmailDelivery({
      userId: opts.userId,
      eventType: opts.eventType,
      status: "skipped",
      templateCode: opts.template,
      error: "no_recipient",
      metadata: { party },
    });
    return { ok: false, error: "no_recipient" };
  }

  const res = await sendTemplate(to, opts.template, opts.data);

  await recordEmailDelivery({
    userId: opts.userId,
    eventType: opts.eventType,
    status: res.ok ? "sent" : "failed",
    toAddress: to,
    templateCode: opts.template,
    error: res.ok ? null : res.error ?? "send_failed",
    metadata: { party },
  });

  if (!res.ok) {
    await logActivity({
      entity_type: "notification",
      entity_id: null,
      action: "email_failed",
      metadata: { event: opts.eventType, party, to, error: res.error },
    });
  }

  return res;
}
