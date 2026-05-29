import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { AccountForm } from "./AccountForm";
import { PasswordForm } from "./PasswordForm";
import { DeleteAccount } from "./DeleteAccount";

export const metadata: Metadata = {
  title: "계정 설정",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const me = await getProfile();
  if (!me) redirect("/login");

  return (
    <div className="space-y-8">
      <header>
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-iris">
          Account
        </p>
        <h1 className="mt-2 font-display text-[24px] font-extrabold tracking-[-0.5px] text-ink-100 sm:text-[28px]">
          계정 설정
        </h1>
        <p className="mt-1 text-[13px] text-ink-50">
          {me.email} · {me.account_type === "business" ? "사업자 회원" : "개인 회원"}
        </p>
      </header>

      <section className="rounded-2xl border border-ink-15 bg-white p-5 sm:p-6">
        <h2 className="font-display text-[15px] font-bold text-ink-100">
          기본 정보
        </h2>
        <p className="mt-1 text-[12.5px] text-ink-50">
          담당자명, 회사명, 전화번호 등 기본 정보를 수정할 수 있습니다. 이메일은 변경할 수 없습니다.
        </p>
        <div className="mt-5">
          <AccountForm profile={me} />
        </div>
      </section>

      <section className="rounded-2xl border border-ink-15 bg-white p-5 sm:p-6">
        <h2 className="font-display text-[15px] font-bold text-ink-100">
          비밀번호 변경
        </h2>
        <p className="mt-1 text-[12.5px] text-ink-50">
          현재 비밀번호를 입력한 뒤 새 비밀번호로 교체합니다. 새 비밀번호는 8자 이상이어야 합니다.
        </p>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </section>

      <section className="rounded-2xl border border-error/30 bg-error/[0.04] p-5 sm:p-6">
        <h2 className="font-display text-[15px] font-bold text-error">
          회원 탈퇴
        </h2>
        <p className="mt-1 text-[12.5px] text-error/80">
          계정을 영구 삭제합니다. 진행 중인 견적·결제·프로젝트가 있는지 먼저 확인해주세요. 운영 기록(견적·결제·프로젝트)은 운영팀이 보관하지만 본인 계정으로는 더 이상 접근할 수 없습니다.
        </p>
        <div className="mt-5">
          <DeleteAccount />
        </div>
      </section>
    </div>
  );
}
