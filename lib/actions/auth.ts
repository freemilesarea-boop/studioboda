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

// Internal: shared user-create + profile-insert + sign-in pipeline
async function provisionAccount(opts: {
  email: string;
  password: string;
  profile: Record<string, unknown> & { account_type: "individual" | "business" };
}) {
  // Honeypot guard — caller checks before calling.
  const authAdmin = createAdminAuthSupabase();

  // Check duplicate email up front (Supabase returns a clean error too, but a
  // dedicated check gives a friendlier message).
  const dbAdmin = createAdminSupabase();
  const { data: existingByEmail } = await dbAdmin
    .from("profiles")
    .select("id")
    .ilike("email", opts.email)
    .maybeSingle();
  if (existingByEmail) {
    return { ok: false as const, error: "이미 가입된 이메일입니다" };
  }
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

  const { data: created, error: createErr } = await authAdmin.auth.admin.createUser({
    email: opts.email,
    password: opts.password,
    email_confirm: true,
    user_metadata: { name: opts.profile.name ?? opts.profile.company_name ?? null },
  });
  if (createErr || !created.user) {
    return {
      ok: false as const,
      error: createErr?.message?.includes("already registered")
        ? "이미 가입된 이메일입니다"
        : createErr?.message ?? "계정 생성에 실패했습니다",
    };
  }

  const userId = created.user.id;
  const { error: profileErr } = await dbAdmin.from("profiles").insert({
    id: userId,
    email: opts.email,
    role: "client",
    ...opts.profile,
  });
  if (profileErr) {
    // Roll back the auth user if profile insert failed (best effort).
    await authAdmin.auth.admin.deleteUser(userId);
    return {
      ok: false as const,
      error: profileErr.message.includes("profiles_username_lower_unique")
        ? "이미 사용 중인 아이디입니다"
        : profileErr.message,
    };
  }

  await logActivity({
    actor_id: userId,
    entity_type: "profile",
    entity_id: userId,
    action: "signed_up",
    metadata: { account_type: opts.profile.account_type },
  });

  // Sign the user in immediately
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
      message: "가입은 완료되었으나 자동 로그인에 실패했습니다. 직접 로그인해주세요.",
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
