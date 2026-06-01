import type { Metadata } from "next";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "개인정보처리방침 · STUDIO BODA",
  description:
    "STUDIO BODA 개인정보처리방침. 수집 항목, 이용 목적, 보관 기간, 제3자 제공, 안전성 확보 조치를 안내합니다.",
  openGraph: {
    title: "STUDIO BODA · 개인정보처리방침",
    type: "article",
  },
};

export default function PrivacyPage() {
  return (
    <div className="prose-boda">
      <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
        Legal
      </p>
      <h1 className="mt-2 font-display text-[32px] font-extrabold leading-[1.15] tracking-display text-ink-100 sm:text-[40px]">
        개인정보처리방침
      </h1>
      <p className="mt-2 text-[12px] text-ink-50">
        시행일: 2026-05-28 · 최종 개정일: 2026-05-28
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <p>STUDIO BODA(이하 “회사”)는 회원가입·견적·결제·프로젝트 운영을 위해 다음 정보를 수집합니다.</p>
        <ul className="boda-list">
          <li><b>일반 회원</b>: 이름, 이메일, 비밀번호(해시), 아이디, 전화번호, 생년월일, 주소</li>
          <li><b>사업자 회원</b>: 상호명, 대표자명, 사업자등록번호, 담당자 이름·전화, 사업장 주소, 업종, 이메일, 아이디, 비밀번호(해시)</li>
          <li><b>견적·결제</b>: 결제대행사(PayApp)로부터 수신하는 결제 결과 정보, 결제 번호, 결제 수단</li>
          <li><b>접근 로그</b>: 접속 IP, 브라우저/OS, 접속 시각 (보안 및 분석 목적)</li>
        </ul>
      </Section>

      <Section title="2. 이용 목적">
        <ul className="boda-list">
          <li>회원 관리: 본인 식별, 부정 이용 방지, 가입 의사 확인, 회원 탈퇴 처리</li>
          <li>서비스 제공: 견적 응대, 결제 처리, 프로젝트 진행, 산출물 전달</li>
          <li>고지·안내: 약관 개정, 보안 공지, 응대 회신</li>
          <li>마케팅 (선택 동의 시): 신규 기능·이벤트 안내</li>
        </ul>
      </Section>

      <Section title="3. 보유 및 이용 기간">
        <p>회사는 법령에 따라 다음 기간 동안 개인정보를 보유합니다.</p>
        <ul className="boda-list">
          <li>회원 정보: 회원 탈퇴 시까지 (탈퇴 즉시 파기. 단 부정 가입 방지 목적 30일 보관 후 파기)</li>
          <li>계약 또는 청약철회 기록: 5년 (전자상거래법)</li>
          <li>대금결제 및 재화 공급 기록: 5년 (전자상거래법)</li>
          <li>소비자 불만 또는 분쟁처리 기록: 3년 (전자상거래법)</li>
          <li>접속 로그: 3개월 (통신비밀보호법)</li>
        </ul>
      </Section>

      <Section title="4. 제3자 제공">
        <p>회사는 회원의 동의 없이 개인정보를 외부에 제공하지 않으며, 다음 예외에 해당하는 경우에만 제공합니다.</p>
        <ul className="boda-list">
          <li>법령에 근거한 수사기관의 요청이 있는 경우</li>
          <li>회원이 사전에 동의한 경우</li>
        </ul>
      </Section>

      <Section title="5. 처리 위탁">
        <table className="mt-3 w-full border border-ink-15 text-left text-[12.5px]">
          <thead className="bg-ink-5">
            <tr>
              <th className="border-b border-ink-15 px-3 py-2">수탁사</th>
              <th className="border-b border-ink-15 px-3 py-2">위탁 업무</th>
              <th className="border-b border-ink-15 px-3 py-2">보유 기간</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-ink-15 px-3 py-2">Supabase Inc.</td>
              <td className="border-b border-ink-15 px-3 py-2">인증·DB·파일 스토리지</td>
              <td className="border-b border-ink-15 px-3 py-2">서비스 종료 시까지</td>
            </tr>
            <tr>
              <td className="border-b border-ink-15 px-3 py-2">Vercel Inc.</td>
              <td className="border-b border-ink-15 px-3 py-2">웹 호스팅·CDN</td>
              <td className="border-b border-ink-15 px-3 py-2">서비스 종료 시까지</td>
            </tr>
            <tr>
              <td className="px-3 py-2">㈜페이앱 (PayApp)</td>
              <td className="px-3 py-2">전자결제 처리</td>
              <td className="px-3 py-2">전자상거래법 준수 기간</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="6. 정보주체의 권리">
        <p>회원은 언제든지 다음 권리를 행사할 수 있습니다.</p>
        <ul className="boda-list">
          <li>개인정보 열람·정정·삭제 요청 (마이페이지 또는 contact@swk.today)</li>
          <li>처리 정지 요청</li>
          <li>회원 탈퇴 (마이페이지)</li>
        </ul>
      </Section>

      <Section title="7. 파기 절차와 방법">
        <ul className="boda-list">
          <li>전자적 파일: 복구 불가능한 방식으로 영구 삭제</li>
          <li>출력물: 분쇄 또는 소각</li>
          <li>법령에 따라 보존이 필요한 경우 보존 기간 종료 후 즉시 파기</li>
        </ul>
      </Section>

      <Section title="8. 안전성 확보 조치">
        <ul className="boda-list">
          <li>비밀번호 일방향 암호화 저장 (Supabase Auth)</li>
          <li>전송 구간 SSL/TLS 암호화</li>
          <li>접근 권한 최소화: 운영팀 중 역할(admin/manager/designer)별 접근 통제</li>
          <li>접속 기록 보관 및 위변조 방지</li>
        </ul>
      </Section>

      <Section title="9. 쿠키 사용">
        <p>회사는 로그인 세션 유지를 위해 필수 쿠키만 사용하며, 광고·추적 쿠키는 사용하지 않습니다. 브라우저 설정에서 쿠키 사용을 거부할 수 있으나 이 경우 로그인 등 일부 기능 이용이 제한될 수 있습니다.</p>
      </Section>

      <Section title="10. 개인정보보호 책임자">
        <ul className="boda-list">
          <li>직책: {company.privacyOfficerTitle}</li>
          {company.privacyOfficerName ? (
            <li>이름: {company.privacyOfficerName}</li>
          ) : null}
          <li>이메일: {company.privacyOfficerEmail}</li>
          <li>소속: {company.name}</li>
        </ul>
      </Section>

      <p className="mt-12 text-[12px] text-ink-50">
        본 방침은 시행일로부터 적용되며, 변경 시 사이트 공지를 통해 안내됩니다.
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <h2 className="font-display text-[18px] font-extrabold tracking-tightish text-ink-100">
        {title}
      </h2>
      <div className="mt-3 text-[13.5px] leading-[1.75] text-ink-70">
        {children}
      </div>
    </section>
  );
}
