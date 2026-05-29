"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, getProfile } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { createNotification, notifyStaff } from "@/lib/notifications";
import {
  cancelRecurringBinding,
  createRegistration,
} from "@/lib/payments/providers/payapp-recurring";
import type { Subscription } from "@/lib/types/db";

type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

// ------- Admin: create a subscription and issue the registration link --------
//
// Flow:
//   1. Insert a `pending_card` subscription row
//   2. Call PayApp `recu=y` to receive a hosted card-registration URL
//   3. Persist the URL on the subscription and notify the customer
//   4. When the customer completes registration, the webhook stores the
//      billing key and transitions status → active.

export async function createSubscriptionAction(input: {
  user_id: string;
  plan_key: string;
  plan_name: string;
  monthly_amount: number;
  description?: string | null;
  staff_notes?: string | null;
}): Promise<ActionResult<{ subscription_id: string; registration_url: string }>> {
  const me = await requireStaff();

  if (!input.user_id || !input.plan_key || !input.plan_name) {
    return { ok: false, error: "필수 정보가 누락되었습니다" };
  }
  if (!Number.isInteger(input.monthly_amount) || input.monthly_amount < 1000) {
    return { ok: false, error: "월 결제 금액이 올바르지 않습니다" };
  }

  const admin = createAdminSupabase();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, name, phone, company_name, contact_phone, contact_name")
    .eq("id", input.user_id)
    .maybeSingle();

  if (!profile) {
    return { ok: false, error: "회원을 찾을 수 없습니다" };
  }
  const buyerPhone = profile.contact_phone || profile.phone || "";
  if (!buyerPhone) {
    return {
      ok: false,
      error: "고객 전화번호가 등록되어 있지 않아 자동결제 등록 링크를 발급할 수 없습니다",
    };
  }

  // Insert pending_card row first so we have an id to embed in the var2.
  const { data: inserted, error: insertErr } = await admin
    .from("subscriptions")
    .insert({
      user_id: input.user_id,
      plan_key: input.plan_key,
      plan_name: input.plan_name,
      monthly_amount: input.monthly_amount,
      description: input.description ?? null,
      staff_notes: input.staff_notes ?? null,
      status: "pending_card" as const,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "구독 생성 실패" };
  }
  const subscriptionId = inserted.id;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://studioboda.vercel.app";

  const reg = await createRegistration({
    subscriptionId,
    planName: input.plan_name,
    monthlyAmount: input.monthly_amount,
    buyerName: profile.contact_name || profile.name || profile.company_name,
    buyerEmail: profile.email,
    buyerPhone,
    returnUrl: `${siteUrl}/me/subscriptions/${subscriptionId}`,
  });

  if (!reg.ok) {
    await admin.from("subscriptions").delete().eq("id", subscriptionId);
    return { ok: false, error: reg.error };
  }

  await admin
    .from("subscriptions")
    .update({
      payapp_registration_url: reg.registrationUrl,
      payapp_registration_mul_no: reg.providerMulNo,
    })
    .eq("id", subscriptionId);

  await logActivity({
    actor_id: me.id,
    entity_type: "subscription",
    entity_id: subscriptionId,
    action: "subscription_registration_requested",
    metadata: {
      plan: input.plan_key,
      amount: input.monthly_amount,
      user_id: input.user_id,
    },
  });

  void createNotification(input.user_id, "subscription_registration_requested", {
    subscription_id: subscriptionId,
    plan_name: input.plan_name,
    monthly_amount: input.monthly_amount,
    registration_url: reg.registrationUrl,
  });

  revalidatePath("/admin/subscriptions");
  return {
    ok: true,
    subscription_id: subscriptionId,
    registration_url: reg.registrationUrl,
  };
}

// ------- Cancel (customer self-serve or staff) -------------------------------

export async function cancelMySubscriptionAction(
  formData: FormData,
): Promise<ActionResult> {
  const me = await getProfile();
  if (!me) return { ok: false, error: "로그인이 필요합니다" };
  const id = String(formData.get("id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!id) return { ok: false, error: "구독 ID가 없습니다" };

  const admin = createAdminSupabase();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .eq("user_id", me.id)
    .maybeSingle();
  if (!sub) return { ok: false, error: "구독을 찾을 수 없습니다" };
  const subscription = sub as Subscription;
  if (subscription.status === "canceled") {
    return { ok: false, error: "이미 해지된 구독입니다" };
  }

  // Release PayApp binding best-effort
  if (subscription.payapp_billing_key) {
    void cancelRecurringBinding(subscription.payapp_billing_key);
  }

  await admin
    .from("subscriptions")
    .update({
      status: "canceled" as const,
      canceled_at: new Date().toISOString(),
      canceled_reason: reason,
      canceled_by_actor: "customer" as const,
      next_charge_at: null,
    })
    .eq("id", id);

  await logActivity({
    actor_id: me.id,
    entity_type: "subscription",
    entity_id: id,
    action: "subscription_canceled",
    metadata: { reason, by: "customer" },
  });

  void notifyStaff("subscription_canceled", {
    subscription_id: id,
    plan_name: subscription.plan_name,
    by: "customer",
    reason,
  });

  revalidatePath("/me/subscriptions");
  revalidatePath(`/me/subscriptions/${id}`);
  return { ok: true };
}

export async function adminCancelSubscriptionAction(
  formData: FormData,
): Promise<ActionResult> {
  const me = await requireStaff();
  const id = String(formData.get("id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!id) return { ok: false, error: "구독 ID가 없습니다" };

  const admin = createAdminSupabase();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!sub) return { ok: false, error: "구독을 찾을 수 없습니다" };
  const subscription = sub as Subscription;
  if (subscription.status === "canceled") {
    return { ok: false, error: "이미 해지된 구독입니다" };
  }

  if (subscription.payapp_billing_key) {
    void cancelRecurringBinding(subscription.payapp_billing_key);
  }

  await admin
    .from("subscriptions")
    .update({
      status: "canceled" as const,
      canceled_at: new Date().toISOString(),
      canceled_reason: reason,
      canceled_by_actor: "staff" as const,
      next_charge_at: null,
    })
    .eq("id", id);

  await logActivity({
    actor_id: me.id,
    entity_type: "subscription",
    entity_id: id,
    action: "subscription_canceled",
    metadata: { reason, by: "staff" },
  });

  if (subscription.user_id) {
    void createNotification(subscription.user_id, "subscription_canceled", {
      subscription_id: id,
      plan_name: subscription.plan_name,
      by: "staff",
      reason,
    });
  }

  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/subscriptions/${id}`);
  return { ok: true };
}

// ------- Admin: resend the registration link if customer lost it ------------

export async function resendRegistrationLinkAction(
  formData: FormData,
): Promise<ActionResult<{ registration_url: string }>> {
  const me = await requireStaff();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "구독 ID가 없습니다" };

  const admin = createAdminSupabase();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("*, profile:user_id(email, name, phone, company_name, contact_phone, contact_name)")
    .eq("id", id)
    .maybeSingle();
  if (!sub) return { ok: false, error: "구독을 찾을 수 없습니다" };
  const subscription = sub as Subscription & {
    profile: {
      email: string | null;
      name: string | null;
      phone: string | null;
      company_name: string | null;
      contact_phone: string | null;
      contact_name: string | null;
    } | null;
  };
  if (subscription.status !== "pending_card") {
    return {
      ok: false,
      error: "이미 카드 등록이 완료되었거나 해지된 구독입니다",
    };
  }
  const buyerPhone =
    subscription.profile?.contact_phone || subscription.profile?.phone || "";
  if (!buyerPhone) {
    return { ok: false, error: "고객 전화번호가 없습니다" };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://studioboda.vercel.app";

  const reg = await createRegistration({
    subscriptionId: id,
    planName: subscription.plan_name,
    monthlyAmount: subscription.monthly_amount,
    buyerName:
      subscription.profile?.contact_name ||
      subscription.profile?.name ||
      subscription.profile?.company_name,
    buyerEmail: subscription.profile?.email,
    buyerPhone,
    returnUrl: `${siteUrl}/me/subscriptions/${id}`,
  });
  if (!reg.ok) return { ok: false, error: reg.error };

  await admin
    .from("subscriptions")
    .update({
      payapp_registration_url: reg.registrationUrl,
      payapp_registration_mul_no: reg.providerMulNo,
    })
    .eq("id", id);

  await logActivity({
    actor_id: me.id,
    entity_type: "subscription",
    entity_id: id,
    action: "subscription_registration_resent",
  });

  revalidatePath(`/admin/subscriptions/${id}`);
  return { ok: true, registration_url: reg.registrationUrl };
}
