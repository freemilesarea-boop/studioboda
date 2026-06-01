// ============================================================
// STUDIO BODA — Multi-channel notification dispatcher
// ============================================================
// notifyCustomer() fans a single event across three channels:
//   1) in_app  — always (notifications table) — never blocked
//   2) email   — when global email channel on + customer email_opt_in
//   3) kakao   — when global kakao channel on + customer kakao_opt_in + phone
// Every channel attempt is audited in notification_deliveries. A failure in
// one channel never blocks the others. Email here is generic-link based; rich
// templated emails (contract_sent etc.) keep using their existing senders.
// ============================================================

import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/email/send";
import { siteUrl } from "@/lib/company";
import type { NotificationType } from "@/lib/notifications";
import { notificationMeta, kakaoTemplateFor } from "./registry";
import { sendKakaoAlimtalk } from "./kakao/provider";

type Channel = "in_app" | "email" | "kakao";
type DeliveryStatus = "sent" | "failed" | "skipped" | "dryrun";

async function recordDelivery(input: {
  userId: string | null;
  eventType: string;
  channel: Channel;
  status: DeliveryStatus;
  templateCode?: string | null;
  toAddress?: string | null;
  error?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminSupabase();
  await admin.from("notification_deliveries").insert({
    user_id: input.userId,
    event_type: input.eventType,
    channel: input.channel,
    status: input.status,
    template_code: input.templateCode ?? null,
    to_address: input.toAddress ?? null,
    error: input.error ?? null,
    metadata: input.metadata ?? {},
  });
}

async function channelEnabled(channel: "email" | "kakao"): Promise<boolean> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("notification_settings")
    .select("value")
    .eq("key", "channels")
    .maybeSingle();
  const v = (data?.value ?? {}) as Record<string, unknown>;
  // email defaults on, kakao defaults off when unset.
  return channel === "email" ? v.email !== false : v.kakao === true;
}

export type NotifyCustomerInput = {
  userId: string | null | undefined;
  type: NotificationType;
  payload?: Record<string, unknown>;
  /** Kakao template variables (고객명/프로젝트명/금액 etc). Optional. */
  kakaoVariables?: Record<string, string>;
};

/**
 * Fan a customer-facing event across in_app + email + kakao. Best-effort per
 * channel; always writes the in_app notification first.
 */
export async function notifyCustomer(
  input: NotifyCustomerInput,
): Promise<void> {
  const { userId, type } = input;
  const payload = input.payload ?? {};
  if (!userId) return;

  const admin = createAdminSupabase();
  const meta = notificationMeta(type);

  // ── 1) in_app (always) ──
  try {
    await admin.from("notifications").insert({ user_id: userId, type, payload });
    await recordDelivery({ userId, eventType: type, channel: "in_app", status: "sent" });
  } catch (err) {
    await recordDelivery({
      userId,
      eventType: type,
      channel: "in_app",
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Load the customer's contact + consent once.
  const { data: profile } = await admin
    .from("profiles")
    .select("email, name, company_name, phone, contact_phone, email_opt_in, kakao_opt_in")
    .eq("id", userId)
    .maybeSingle();
  const name = profile?.name ?? profile?.company_name ?? "고객";
  const link = `${siteUrl}${meta.hrefFor(payload)}`;

  // ── 2) email ──
  try {
    const enabled = await channelEnabled("email");
    const optedIn = profile?.email_opt_in !== false;
    const to = profile?.email ?? null;
    if (!enabled) {
      await recordDelivery({ userId, eventType: type, channel: "email", status: "skipped", error: "channel_off" });
    } else if (!optedIn) {
      await recordDelivery({ userId, eventType: type, channel: "email", status: "skipped", error: "no_consent" });
    } else if (!to) {
      await recordDelivery({ userId, eventType: type, channel: "email", status: "skipped", error: "no_email" });
    } else {
      const res = await sendEmail({
        to,
        subject: `[STUDIO BODA] ${meta.label}`,
        html: genericEmailHtml(name, meta.label, meta.summary(payload), link),
      });
      await recordDelivery({
        userId,
        eventType: type,
        channel: "email",
        status: res.ok ? "sent" : "failed",
        toAddress: to,
        error: res.ok ? null : res.error ?? "send_failed",
      });
      if (!res.ok) {
        await logActivity({
          entity_type: "notification",
          entity_id: null,
          action: "email_failed",
          metadata: { type, error: res.error },
        });
      }
    }
  } catch (err) {
    await recordDelivery({
      userId,
      eventType: type,
      channel: "email",
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // ── 3) kakao ──
  try {
    const templateCode = kakaoTemplateFor(type);
    const enabled = await channelEnabled("kakao");
    const optedIn = profile?.kakao_opt_in === true;
    const phone = (profile?.contact_phone || profile?.phone || "").trim();
    if (!templateCode) {
      // No kakao template for this event — nothing to do.
    } else if (!enabled) {
      await recordDelivery({ userId, eventType: type, channel: "kakao", status: "skipped", templateCode, error: "channel_off" });
    } else if (!optedIn) {
      await recordDelivery({ userId, eventType: type, channel: "kakao", status: "skipped", templateCode, error: "no_consent" });
    } else if (!phone) {
      await recordDelivery({ userId, eventType: type, channel: "kakao", status: "skipped", templateCode, error: "no_phone" });
      await logActivity({
        entity_type: "notification",
        entity_id: null,
        action: "kakao_skipped_no_phone",
        metadata: { type, user_id: userId },
      });
    } else {
      const variables = {
        고객명: name,
        프로젝트명: String(payload.title ?? payload.project_title ?? "프로젝트"),
        금액:
          typeof payload.amount === "number"
            ? `${new Intl.NumberFormat("ko-KR").format(payload.amount)}원`
            : "",
        링크: link,
        ...(input.kakaoVariables ?? {}),
      };
      const res = await sendKakaoAlimtalk({ toPhone: phone, templateCode, variables });
      await recordDelivery({
        userId,
        eventType: type,
        channel: "kakao",
        status: res.ok ? (res.dryRun ? "dryrun" : "sent") : "failed",
        templateCode,
        toAddress: phone,
        error: res.ok ? null : res.error,
      });
    }
  } catch (err) {
    await recordDelivery({
      userId,
      eventType: type,
      channel: "kakao",
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Kakao-only dispatch for events whose in_app + email are already handled by
 * an existing sender (e.g. contract_sent rich email). Respects global kakao
 * channel + per-customer consent + phone, and audits to notification_deliveries.
 */
export async function dispatchKakao(input: {
  userId: string | null | undefined;
  type: NotificationType;
  payload?: Record<string, unknown>;
  kakaoVariables?: Record<string, string>;
}): Promise<void> {
  const { userId, type } = input;
  if (!userId) return;
  const payload = input.payload ?? {};
  const templateCode = kakaoTemplateFor(type);
  if (!templateCode) return;

  const admin = createAdminSupabase();
  try {
    const enabled = await channelEnabled("kakao");
    if (!enabled) {
      await recordDelivery({ userId, eventType: type, channel: "kakao", status: "skipped", templateCode, error: "channel_off" });
      return;
    }
    const { data: profile } = await admin
      .from("profiles")
      .select("name, company_name, phone, contact_phone, kakao_opt_in")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.kakao_opt_in !== true) {
      await recordDelivery({ userId, eventType: type, channel: "kakao", status: "skipped", templateCode, error: "no_consent" });
      return;
    }
    const phone = (profile?.contact_phone || profile?.phone || "").trim();
    if (!phone) {
      await recordDelivery({ userId, eventType: type, channel: "kakao", status: "skipped", templateCode, error: "no_phone" });
      await logActivity({ entity_type: "notification", entity_id: null, action: "kakao_skipped_no_phone", metadata: { type, user_id: userId } });
      return;
    }
    const meta = notificationMeta(type);
    const variables = {
      고객명: profile?.name ?? profile?.company_name ?? "고객",
      프로젝트명: String(payload.title ?? payload.project_title ?? "프로젝트"),
      금액:
        typeof payload.amount === "number"
          ? `${new Intl.NumberFormat("ko-KR").format(payload.amount)}원`
          : "",
      링크: `${siteUrl}${meta.hrefFor(payload)}`,
      ...(input.kakaoVariables ?? {}),
    };
    const res = await sendKakaoAlimtalk({ toPhone: phone, templateCode, variables });
    await recordDelivery({
      userId,
      eventType: type,
      channel: "kakao",
      status: res.ok ? (res.dryRun ? "dryrun" : "sent") : "failed",
      templateCode,
      toAddress: phone,
      error: res.ok ? null : res.error,
    });
  } catch (err) {
    await recordDelivery({
      userId,
      eventType: type,
      channel: "kakao",
      status: "failed",
      templateCode,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function genericEmailHtml(
  name: string,
  title: string,
  summary: string,
  link: string,
): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html><html lang="ko"><body style="margin:0;padding:0;background:#F6F6FA;font-family:Pretendard,-apple-system,system-ui,sans-serif;color:#0A0A12;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F6FA;padding:40px 16px;"><tr><td align="center">
    <table role="presentation" width="520" style="max-width:520px;background:#fff;border:1px solid #E6E6EC;border-radius:18px;overflow:hidden;"><tr><td style="padding:30px 30px 0;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.12em;color:#6E5BFF;">STUDIO BODA</div>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:800;color:#0A0A12;">${esc(title)}</h1>
    </td></tr><tr><td style="padding:14px 30px 0;font-size:14px;line-height:1.7;color:#494956;">
      <p><b>${esc(name)}</b>님, ${esc(summary)}</p>
    </td></tr><tr><td style="padding:22px 30px 0;">
      <a href="${esc(link)}" style="display:inline-block;background:#6E5BFF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:13px;">확인하기 →</a>
    </td></tr><tr><td style="padding:26px 30px 30px;font-size:11px;color:#7E7E8C;border-top:1px solid #E6E6EC;margin-top:24px;">© 2026 STUDIO BODA · contact@swk.today</td></tr></table>
  </td></tr></table></body></html>`;
}
