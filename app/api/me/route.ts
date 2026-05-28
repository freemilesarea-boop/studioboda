import { NextResponse } from "next/server";
import { createServerAuthSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerAuthSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const p = (data ?? null) as Profile | null;
  return NextResponse.json({
    ok: true,
    id: user.id,
    email: p?.email ?? user.email ?? null,
    name: p?.name ?? null,
    phone: p?.phone ?? null,
    contact_phone: p?.contact_phone ?? null,
    company_name: p?.company_name ?? null,
    account_type: p?.account_type ?? "individual",
    role: p?.role ?? "client",
  });
}
