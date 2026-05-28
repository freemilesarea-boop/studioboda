"use server";

import { redirect } from "next/navigation";
import { createServerAuthSupabase } from "@/lib/supabase/server";
import { createAdminAuthSupabase, createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import {
  businessSignupSchema,
  individualSignupSchema,
  loginSchema,
  publicLoginSchema,
  type BusinessSignupInput,
  type IndividualSignupInput,
  type LoginInput,
  type PublicLoginInput,
} from "@/lib/schemas";

// Staff login (used by /admin/login)
export async function loginAction(input: LoginInput, next?: string) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "이메일 또는 비밀번호 형식이 올바르지 않습니다",
    };
  }
  const supabase = createServerAuthSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false as const, error: "로그인 실패: 이메일/비밀번호를 확인하세요" };
  }
  return { ok: true as const, next: next || "/admin" };
}

// Public login (email or username)
export async function publicLoginAction(input: PublicLoginInput, next?: string) {
  const parsed = publicLoginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다",
    };
  }

  let email = parsed.data.identifier.trim();
  if (!email.includes("@")) {
    // Resolve username → email via service-role lookup (RLS bypass).
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("profiles")
      .select("email")
      .ilike("username", email)
      .maybeSingle();
    if (!data?.email) {
      return { ok: false as const, error: "존재하지 않는 아이디입니다" };
    }
    email = data.email;
  }

  const supabase = createServerAuthSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false as const, error: "이메일/아이디 또는 비밀번호가 올바르지 않습니다" };
  }
  return { ok: true as const, next: next || "/me" };
}

export async function logoutAction() {
  const supabase = createServerAuthSupabase();
  await supabase.auth.signOut();
  redirect("/");
}

import { publicEnv } from "@/lib/env";

// Password reset request — sends a reset email via Supabase Auth.
export async function requestPasswordResetAction(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false as const, error: "이메일을 정확히 입력해주세요" };
  }
  const supabase = createServerAuthSupabase();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? publicEnv().SITE_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });
  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

// Update password — call from /reset-password after Supabase recovery link
// landed the user into a logged-in session via PKCE.
export async function updatePasswordAction(newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { ok: false as const, error: "비밀번호는 8자 이상이어야 합니다" };
  }
  const supabase = createServerAuthSupabase();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

const DUPLICATE_EMAIL_MESSAGE =
  "이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해주세요.";

// Translate any Supabase profile-write error into a friendly Korean message.
// Never echo raw "duplicate key value violates unique constraint …" text.
function friendlyProfileError(rawMessage: string | undefined): string {
  if (!rawMessage) return "프로필 저장에 실패했습니다";
  if (rawMessage.includes("profiles_username_lower_unique")) {
    return "이미 사용 중인 아이디입니다";
  }
  if (rawMessage.includes("profiles_pkey")) {
    return DUPLICATE_EMAIL_MESSAGE;
  }
  if (rawMessage.toLowerCase().includes("duplicate key")) {
    return "이미 등록된 정보입니다. 잠시 후 다시 시도해주세요.";
  }
  return "프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

// Internal: idempotent user-create + profile-upsert + sign-in pipeline.
// - profiles row is auto-created by the `handle_new_user` trigger when the
//   auth user is inserted; our writes always upsert on id so retries (or the
//   trigger race) never produce a PK collision.
// - duplicate email is surfaced before createUser via the indexed profiles
//   email lookup, and also caught from createUser's own error as a fallback.
// - all errors funnel through friendlyProfileError so raw constraint names
//   never reach the user.
async function provisionAccount(opts: {
  email: string;
  password: string;
  profile: Record<string, unknown> & { account_type: "individual" | "business" };
}) {
  const authAdmin = createAdminAuthSupabase();
  const dbAdmin = createAdminSupabase();
  const normalizedEmail = opts.email.trim().toLowerCase();

  // ---- Pre-flight: indexed profiles email lookup (fast, ~1ms) ----
  const { data: existingByEmail } = await dbAdmin
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();
  if (existingByEmail) {
    return { ok: false as const, error: DUPLICATE_EMAIL_MESSAGE };
  }

  // ---- Username uniqueness check (case-insensitive) ----
  if (opts.profile.username) {
    const { data: existingByUsername } = await dbAdmin
      .from("profiles")
      .select("id")
      .ilike("username", opts.profile.username as string)
      .maybeSingle();
    if (existingByUsername) {
      return { ok: false as const, error: "이미 사용 중인 아이디입니다" };
    }
  }

  // ---- Create the auth user. handle_new_user trigger auto-inserts a stub
  //      profile row (id + email + name). ----
  const { data: created, error: createErr } =
    await authAdmin.auth.admin.createUser({
      email: opts.email,
      password: opts.password,
      email_confirm: true,
      user_metadata: {
        name: opts.profile.name ?? opts.profile.company_name ?? null,
      },
    });
  if (createErr || !created?.user) {
    const lower = (createErr?.message ?? "").toLowerCase();
    if (lower.includes("already registered") || lower.includes("already exists")) {
      return { ok: false as const, error: DUPLICATE_EMAIL_MESSAGE };
    }
    return {
      ok: false as const,
      error: createErr?.message ?? "계정 생성에 실패했습니다",
    };
  }
  const userId = created.user.id;

  // ---- Upsert the profile (id-conflict). This fills in role, account_type,
  //      and all typed fields without colliding with the trigger-inserted
  //      stub. Idempotent on retry. ----
  const profileRow = {
    id: userId,
    email: opts.email,
    role: "client" as const,
    ...opts.profile,
  };

  const first = await dbAdmin
    .from("profiles")
    .upsert(profileRow, { onConflict: "id" });
  let profileErr = first.error;

  // Single retry guards against a rare race between the trigger and our upsert.
  if (profileErr) {
    const retry = await dbAdmin
      .from("profiles")
      .upsert(profileRow, { onConflict: "id" });
    profileErr = retry.error;
  }

  if (profileErr) {
    // Best-effort rollback of the auth user when no profile row landed at all,
    // so we don't orphan a half-provisioned account.
    const { data: existing } = await dbAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!existing) {
      await authAdmin.auth.admin.deleteUser(userId);
    }
    return {
      ok: false as const,
      error: friendlyProfileError(profileErr.message),
    };
  }

  await logActivity({
    actor_id: userId,
    entity_type: "profile",
    entity_id: userId,
    action: "signed_up",
    metadata: { account_type: opts.profile.account_type },
  });

  // Welcome notification + email (fire-and-forget)
  const displayName =
    (opts.profile.name as string | undefined) ||
    (opts.profile.company_name as string | undefined) ||
    opts.email.split("@")[0];
  try {
    const { createNotification } = await import("@/lib/notifications");
    await createNotification(userId, "welcome", { name: displayName });
  } catch {
    /* notification optional */
  }
  try {
    const { sendTemplate } = await import("@/lib/email/send");
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://studioboda.vercel.app";
    void sendTemplate(opts.email, "welcome", {
      name: displayName,
      siteUrl,
    });
  } catch {
    /* email optional */
  }

  // ---- Auto sign-in ----
  const supabase = createServerAuthSupabase();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: opts.email,
    password: opts.password,
  });
  if (signInErr) {
    return {
      ok: true as const,
      autoLogin: false as const,
      next: "/login",
      message:
        "가입은 완료되었으나 자동 로그인에 실패했습니다. 직접 로그인해주세요.",
    };
  }

  return { ok: true as const, autoLogin: true as const, next: "/me" };
}

export async function signupIndividualAction(input: IndividualSignupInput) {
  const parsed = individualSignupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다",
    };
  }
  if (parsed.data.website && parsed.data.website.length > 0) {
    // honeypot triggered — silently succeed
    return { ok: true as const, autoLogin: false as const, next: "/me" };
  }

  const { name, phone, birth_date, address, username, email, password } =
    parsed.data;

  return provisionAccount({
    email,
    password,
    profile: {
      account_type: "individual",
      name,
      phone,
      birth_date,
      address,
      username,
    },
  });
}

export async function signupBusinessAction(input: BusinessSignupInput) {
  const parsed = businessSignupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다",
    };
  }
  if (parsed.data.website && parsed.data.website.length > 0) {
    return { ok: true as const, autoLogin: false as const, next: "/me" };
  }

  const {
    company_name,
    representative_name,
    business_registration_number,
    contact_name,
    contact_phone,
    business_address,
    industry,
    username,
    email,
    password,
  } = parsed.data;

  // Normalize BRN to 000-00-00000
  const digits = business_registration_number.replace(/\D/g, "");
  const brn = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;

  return provisionAccount({
    email,
    password,
    profile: {
      account_type: "business",
      name: company_name,
      company_name,
      representative_name,
      business_registration_number: brn,
      contact_name,
      contact_phone,
      business_address,
      industry,
      username,
    },
  });
}
