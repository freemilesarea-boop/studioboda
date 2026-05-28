import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { roleLabels, type Profile } from "@/lib/types/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Members",
  robots: { index: false, follow: false },
};

const ROLE_OPTIONS = ["all", "client", "admin", "manager", "designer"] as const;
const TYPE_OPTIONS = ["all", "individual", "business"] as const;

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { role?: string; type?: string; q?: string };
}) {
  const role = (
    ROLE_OPTIONS.includes(searchParams.role as (typeof ROLE_OPTIONS)[number])
      ? searchParams.role
      : "all"
  ) as (typeof ROLE_OPTIONS)[number];
  const type = (
    TYPE_OPTIONS.includes(searchParams.type as (typeof TYPE_OPTIONS)[number])
      ? searchParams.type
      : "all"
  ) as (typeof TYPE_OPTIONS)[number];
  const q = (searchParams.q ?? "").trim();

  const admin = createAdminSupabase();
  let query = admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (role !== "all") query = query.eq("role", role);
  if (type !== "all") query = query.eq("account_type", type);
  if (q) {
    const safe = q.replace(/[,()]/g, " ");
    query = query.or(
      `email.ilike.%${safe}%,name.ilike.%${safe}%,company_name.ilike.%${safe}%`,
    );
  }
  const { data } = await query;
  const rows = (data ?? []) as Profile[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
            Members
          </p>
          <h2 className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.4px] text-ink-100">
            회원 관리{" "}
            <span className="num ml-2 text-[14px] font-bold text-ink-50">
              {rows.length}
            </span>
          </h2>
        </div>
        <form action="/admin/members" className="flex gap-2">
          {role !== "all" ? <input type="hidden" name="role" value={role} /> : null}
          {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="이름·이메일·상호명"
            className="h-9 w-[220px] rounded-lg border border-ink-15 bg-white px-3 text-[12.5px] outline-none focus:border-iris/60"
          />
          <button
            type="submit"
            className="h-9 rounded-lg bg-ink-100 px-3.5 font-display text-[12px] font-bold text-white"
          >
            검색
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-ink-15 bg-white p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-2 font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
            Role
          </span>
          {ROLE_OPTIONS.map((r) => (
            <Link
              key={r}
              href={`/admin/members?${new URLSearchParams({
                ...(r !== "all" ? { role: r } : {}),
                ...(type !== "all" ? { type } : {}),
                ...(q ? { q } : {}),
              }).toString()}`}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
                r === role
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              {r === "all"
                ? "전체"
                : r === "client"
                ? "클라이언트"
                : roleLabels[r as keyof typeof roleLabels]}
            </Link>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-2 font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-50">
            Type
          </span>
          {TYPE_OPTIONS.map((t) => (
            <Link
              key={t}
              href={`/admin/members?${new URLSearchParams({
                ...(role !== "all" ? { role } : {}),
                ...(t !== "all" ? { type: t } : {}),
                ...(q ? { q } : {}),
              }).toString()}`}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${
                t === type
                  ? "border-ink-100 bg-ink-100 text-white"
                  : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
              }`}
            >
              {t === "all"
                ? "전체"
                : t === "business"
                ? "사업자"
                : "일반"}
            </Link>
          ))}
        </div>
      </div>

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyState
            icon="ti-users"
            title="조회된 회원이 없습니다"
            description="조건을 조정해보세요."
          />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="min-w-full text-left text-[12.5px]">
              <thead className="border-b border-ink-15 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
                <tr>
                  <th className="px-5 py-2.5">이름 / 상호</th>
                  <th className="px-3 py-2.5">이메일</th>
                  <th className="px-3 py-2.5">유형</th>
                  <th className="px-3 py-2.5">역할</th>
                  <th className="px-3 py-2.5">가입</th>
                  <th className="px-5 py-2.5 text-right">브랜드 자산</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-15">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-ink-5">
                    <td className="px-5 py-3">
                      <p className="font-display font-bold text-ink-100">
                        {p.name || p.company_name || p.email.split("@")[0]}
                      </p>
                      {p.company_name ? (
                        <p className="text-[11px] text-ink-50">
                          {p.company_name}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-ink-70">{p.email}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-ink-5 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-ink-70">
                        {p.account_type === "business" ? "Business" : "Individual"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-iris-light px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-iris">
                        {roleLabels[p.role]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11px] text-ink-50">
                      {formatDistanceToNow(new Date(p.created_at), {
                        locale: ko,
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/members/${p.id}/brand`}
                        className="text-[12px] font-bold text-iris hover:opacity-80"
                      >
                        브랜드 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
