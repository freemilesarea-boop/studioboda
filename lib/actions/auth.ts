"use server";

import { redirect } from "next/navigation";
import { createServerAuthSupabase } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export async function loginAction(input: LoginInput, next?: string) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "이메일 또는 비밀번호 형식이 올바르지 않습니다" };
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

export async function logoutAction() {
  const supabase = createServerAuthSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
