"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerAuthSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import type { AccountType } from "@/lib/types/db";

function s(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed ? trimmed : null;
}

export async function updateMyProfileAction(formData: FormData) {
  const me = await getProfile();
  if (!me) return { ok: false as const, error: "로그인이 필요합니다" };

  const isBusiness: AccountType =
    me.account_type === "business" ? "business" : "individual";

  const patch: Record<string, unknown> = {
    name: s(formData.get("name")),
    phone: s(formData.get("phone")),
  };

  if (isBusiness === "business") {
    patch.company_name = s(formData.get("company_name"));
    patch.representative_name = s(formData.get("representative_name"));
    patch.business_registration_number = s(
      formData.get("business_registration_number"),
    );
    patch.contact_name = s(formData.get("contact_name"));
    patch.contact_phone = s(formData.get("contact_phone"));
    patch.business_address = s(formData.get("business_address"));
    patch.industry = s(formData.get("industry"));
  } else {
    patch.address = s(formData.get("address"));
  }

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", me.id);
  if (error) return { ok: false as const, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "profile",
    entity_id: me.id,
    action: "profile_updated",
  });

  revalidatePath("/me");
  revalidatePath("/me/account");
  return { ok: true as const };
}

export async function changeMyPasswordAction(formData: FormData) {
  const me = await getProfile();
  if (!me) return { ok: false as const, error: "로그인이 필요합니다" };

  const current = (formData.get("current_password") as string | null) ?? "";
  const next = (formData.get("new_password") as string | null) ?? "";
  if (next.length < 8) {
    return { ok: false as const, error: "새 비밀번호는 8자 이상이어야 합니다" };
  }
  if (current === next) {
    return { ok: false as const, error: "현재 비밀번호와 동일합니다" };
  }

  // Re-authenticate with the supplied current password before changing.
  const supabase = createServerAuthSupabase();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: me.email,
    password: current,
  });
  if (signInErr) {
    return { ok: false as const, error: "현재 비밀번호가 일치하지 않습니다" };
  }

  const { error: updateErr } = await supabase.auth.updateUser({
    password: next,
  });
  if (updateErr) {
    return { ok: false as const, error: updateErr.message };
  }

  await logActivity({
    actor_id: me.id,
    entity_type: "profile",
    entity_id: me.id,
    action: "password_changed",
  });

  return { ok: true as const };
}

export async function deleteMyAccountAction(formData: FormData) {
  const me = await getProfile();
  if (!me) redirect("/login");

  const confirmText = (formData.get("confirm_text") as string | null) ?? "";
  if (confirmText !== "탈퇴합니다") {
    return {
      ok: false as const,
      error: "확인 문구가 정확히 입력되지 않았습니다",
    };
  }

  // Re-authenticate with the supplied password as a second-factor guard.
  const password = (formData.get("password") as string | null) ?? "";
  if (!password) {
    return { ok: false as const, error: "비밀번호를 입력해주세요" };
  }
  const supabase = createServerAuthSupabase();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: me.email,
    password,
  });
  if (signInErr) {
    return { ok: false as const, error: "비밀번호가 일치하지 않습니다" };
  }

  // Log before deletion so we still have an audit trail.
  await logActivity({
    actor_id: me.id,
    entity_type: "profile",
    entity_id: me.id,
    action: "account_deleted",
    metadata: { email: me.email },
  });

  // Hard-delete the auth user. profiles row is removed by the cascading FK,
  // inquiries / quotes / projects / payments keep their rows with user_id set
  // to NULL (per their ON DELETE SET NULL constraints) so operational history
  // is preserved.
  const admin = createAdminSupabase();
  const { error: delErr } = await admin.auth.admin.deleteUser(me.id);
  if (delErr) {
    return { ok: false as const, error: delErr.message };
  }

  // Sign the cookie session out — auth.admin.deleteUser invalidates server
  // sessions but the cookie still lingers in the browser until next request.
  await supabase.auth.signOut();
  redirect("/?account_deleted=1");
}
