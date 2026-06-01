import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import type { Profile, Setting } from "@/lib/types/db";
import { roleLabels } from "@/lib/types/db";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Settings",
  robots: { index: false, follow: false },
};

const DEFAULT_SERVICES = [
  { key: "detail", label: "상세페이지", base: 99000, days: 3 },
  { key: "deck", label: "회사소개서", base: 149000, days: 5 },
  { key: "shorts", label: "쇼츠·릴스", base: 79000, days: 3 },
  { key: "renewal", label: "콘텐츠 리뉴얼", base: 59000, days: 2 },
  { key: "brand-pkg", label: "브랜드 패키지", base: 280000, days: 10 },
  { key: "subscription", label: "정기 구독", base: 390000, days: 30 },
];

export default async function SettingsPage() {
  const me = await getProfile();
  const admin = createAdminSupabase();
  const [{ data: staff }, { data: rows }] = await Promise.all([
    admin
      .from("profiles")
      .select("*")
      .order("role"),
    admin.from("settings").select("*"),
  ]);
  const settingMap: Record<string, Setting> = {};
  (rows ?? []).forEach((r) => {
    settingMap[(r as Setting).key] = r as Setting;
  });
  const pricing =
    (settingMap.pricing?.value as
      | { items?: { key: string; label: string; base: number; days: number }[] }
      | undefined)?.items ?? DEFAULT_SERVICES;
  const team = (staff ?? []) as Profile[];
  const isAdmin = me?.role === "admin";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
          Settings
        </p>
        <h2 className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.4px] text-ink-100">
          운영 설정
        </h2>
        {!isAdmin && (
          <p className="mt-1 text-[12px] text-warning">
            읽기 전용 — 변경은 admin 권한만 가능합니다.
          </p>
        )}
      </div>

      <AdminCard title="서비스 기본 가격">
        <div className="-mx-5 overflow-x-auto">
          <table className="min-w-full text-left text-[12.5px]">
            <thead className="border-b border-ink-15 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
              <tr>
                <th className="px-5 py-2.5">서비스</th>
                <th className="px-3 py-2.5 text-right">기본 가격</th>
                <th className="px-3 py-2.5 text-right">기본 납기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-15">
              {pricing.map((p) => (
                <tr key={p.key}>
                  <td className="px-5 py-3 font-display font-bold text-ink-100">
                    {p.label}
                  </td>
                  <td className="num px-3 py-3 text-right text-ink-70">
                    {new Intl.NumberFormat("ko-KR").format(p.base)}원
                  </td>
                  <td className="px-3 py-3 text-right text-ink-70">
                    {p.days}일
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-ink-50">
          기본값은 코드에 내장되어 있으며, settings 테이블의 `pricing` row를 통해
          오버라이드할 수 있습니다.
        </p>
      </AdminCard>

      <AdminCard title="관리자 · 팀">
        {team.length === 0 ? (
          <EmptyState title="등록된 사용자가 없습니다" />
        ) : (
          <ul className="divide-y divide-ink-15">
            {team.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 py-2.5 text-[12.5px]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-iris-light font-display text-[11px] font-bold text-iris">
                  {(u.name ?? u.email).slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold text-ink-100">
                    {u.name ?? u.email}
                  </p>
                  <p className="text-[11px] text-ink-50">{u.email}</p>
                </div>
                <span className="rounded-full bg-ink-5 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-ink-70">
                  {roleLabels[u.role]}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-ink-50">
          관리자 추가는 <code className="rounded bg-ink-5 px-1">npm run create-admin</code>{" "}
          명령으로 수행하세요. (서버 콘솔에서만 실행)
        </p>
      </AdminCard>

      <AdminCard title="브랜드 기본 정보">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <Row label="브랜드" value="STUDIO BODA" />
          <Row label="이메일" value="contact@swk.today" />
          <Row label="위치" value="Seoul, KR · KST" />
          <Row label="응답" value="평균 24시간 이내" />
        </dl>
      </AdminCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </dt>
      <dd className="text-[13px] text-ink-100">{value}</dd>
    </div>
  );
}
