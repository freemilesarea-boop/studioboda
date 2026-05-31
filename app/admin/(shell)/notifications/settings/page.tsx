import { requireStaff } from "@/lib/auth";
import { getNotificationChannels, recentDeliveries } from "@/lib/queries/notification-settings";
import { KAKAO_TEMPLATES } from "@/lib/notifications/kakao/templates";
import { getKakaoProvider } from "@/lib/notifications/kakao/provider";
import { NotificationSettingsForm } from "./NotificationSettingsForm";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 알림 설정",
  robots: { index: false, follow: false },
};

const CH_TONE: Record<string, string> = {
  in_app: "bg-ink-5 text-ink-70",
  email: "bg-iris/15 text-iris",
  kakao: "bg-warning/15 text-warning",
};
const ST_TONE: Record<string, string> = {
  sent: "bg-success/15 text-success",
  dryrun: "bg-sky/15 text-sky",
  skipped: "bg-ink-5 text-ink-50",
  failed: "bg-error/15 text-error",
};

export default async function NotificationSettingsPage() {
  await requireStaff();
  const [channels, deliveries] = await Promise.all([
    getNotificationChannels(),
    recentDeliveries(40),
  ]);
  const kakaoDryRun = getKakaoProvider().isDryRun();
  const templates = Object.values(KAKAO_TEMPLATES);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-[20px] font-extrabold tracking-tightish text-ink-100">
          알림 설정
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-50">
          웹 알림은 항상 발송됩니다. 이메일·카카오 알림톡 채널을 전역으로 켜고 끌 수
          있습니다. 카카오는 현재{" "}
          {kakaoDryRun ? (
            <b className="text-warning">dryRun 모드 (실발송 안 함, 로그만)</b>
          ) : (
            <b className="text-success">실발송 모드</b>
          )}
          입니다.
        </p>
      </header>

      <NotificationSettingsForm
        initialEmail={channels.email}
        initialKakao={channels.kakao}
        kakaoDryRun={kakaoDryRun}
      />

      {/* 카카오 템플릿 코드 */}
      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[14px] font-bold text-ink-100">
          카카오 알림톡 템플릿{" "}
          <span className="num text-ink-50">{templates.length}</span>
        </h2>
        <p className="mt-1 text-[11.5px] text-ink-50">
          실 연동 시 카카오 BizMessage 채널에 아래 코드·본문으로 템플릿 심사를 받아야
          합니다.
        </p>
        <ul className="mt-3 divide-y divide-ink-15">
          {templates.map((t) => (
            <li key={t.code} className="py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-iris">{t.code}</span>
                <span className="font-display text-[12.5px] font-bold text-ink-100">
                  {t.title}
                </span>
                <span className="text-[10.5px] text-ink-50">
                  변수: {t.variables.join(", ")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 최근 발송 감사 */}
      <section className="rounded-2xl border border-ink-15 bg-white p-5">
        <h2 className="font-display text-[14px] font-bold text-ink-100">
          최근 채널별 발송 기록
        </h2>
        {deliveries.length === 0 ? (
          <p className="mt-3 text-[12.5px] text-ink-50">아직 발송 기록이 없습니다.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-ink-15 text-[10px] uppercase tracking-caption text-ink-50">
                  <th className="py-2 pr-3">이벤트</th>
                  <th className="py-2 pr-3">채널</th>
                  <th className="py-2 pr-3">상태</th>
                  <th className="py-2 pr-3">대상/사유</th>
                  <th className="py-2">시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-15">
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2 pr-3 font-medium text-ink-100">{d.event_type}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CH_TONE[d.channel] ?? "bg-ink-5"}`}>
                        {d.channel}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ST_TONE[d.status] ?? "bg-ink-5"}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-ink-50">
                      {d.error ?? d.to_address ?? "—"}
                    </td>
                    <td className="py-2 text-ink-50">
                      {new Date(d.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
