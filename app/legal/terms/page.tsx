import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 · STUDIO BODA",
  description:
    "STUDIO BODA 서비스 이용약관 (제·개정일 2026-05-28). 회원가입·견적·결제·프로젝트 운영에 적용됩니다.",
  openGraph: {
    title: "STUDIO BODA · 이용약관",
    type: "article",
  },
};

export default function TermsPage() {
  return (
    <div className="prose-boda">
      <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
        Legal
      </p>
      <h1 className="mt-2 font-display text-[32px] font-extrabold leading-[1.15] tracking-display text-ink-100 sm:text-[40px]">
        이용약관
      </h1>
      <p className="mt-2 text-[12px] text-ink-50">
        시행일: 2026-05-28 · 최종 개정일: 2026-05-28
      </p>

      <Section title="제1조 (목적)">
        본 약관은 STUDIO BODA(이하 “회사”)가 운영하는 웹사이트 및 관련 서비스(이하 “서비스”)의
        이용과 관련하여 회사와 회원 사이의 권리, 의무, 책임사항 및 기타 필요한 사항을 규정함을
        목적으로 합니다.
      </Section>

      <Section title="제2조 (정의)">
        <ol className="boda-list">
          <li>“서비스”란 회사가 제공하는 AI 기반 콘텐츠·광고·디자인 제작 서비스를 의미합니다.</li>
          <li>“회원”이란 본 약관에 동의하고 회사가 정한 절차에 따라 가입한 자를 말하며, 일반 회원과 사업자 회원으로 구분됩니다.</li>
          <li>“프로젝트”란 회원이 신청한 견적이 결제 완료되어 진행되는 제작 작업 단위를 말합니다.</li>
          <li>“결제대행사”란 회사가 결제 처리를 위해 연동한 PayApp을 의미합니다.</li>
        </ol>
      </Section>

      <Section title="제3조 (약관의 게시와 개정)">
        <ol className="boda-list">
          <li>회사는 본 약관을 회원이 그 내용을 알 수 있도록 서비스 화면에 게시합니다.</li>
          <li>회사는 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정 사유를 명시하여 최소 7일 전부터 공지합니다.</li>
          <li>회원에게 불리한 개정의 경우 적용일자 30일 전부터 공지하며, 회원은 거부 의사를 표시하지 않으면 동의한 것으로 간주됩니다.</li>
        </ol>
      </Section>

      <Section title="제4조 (회원가입)">
        <ol className="boda-list">
          <li>가입은 신청자가 본 약관 및 개인정보처리방침에 동의하고 필수 정보를 입력하여 신청합니다.</li>
          <li>회사는 다음의 경우 가입 신청을 승낙하지 않을 수 있습니다.
            <ul className="boda-sublist">
              <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
              <li>등록 내용에 허위 또는 누락이 있는 경우</li>
              <li>이전에 회원자격을 상실한 적이 있는 경우</li>
            </ul>
          </li>
          <li>회원은 가입 시 등록한 정보에 변경이 있을 경우 즉시 수정해야 합니다.</li>
        </ol>
      </Section>

      <Section title="제5조 (서비스의 제공)">
        <ol className="boda-list">
          <li>회사는 상세페이지, 광고 배너, SNS 콘텐츠, 썸네일, 브랜드 디자인 등 콘텐츠 제작 서비스를 제공합니다.</li>
          <li>서비스의 구체적인 범위와 산출물은 회원이 수락한 견적서에 따릅니다.</li>
          <li>회사는 시스템 점검, 천재지변, 기술적 결함 등 불가항력 사유로 서비스 제공을 일시 중단할 수 있습니다.</li>
        </ol>
      </Section>

      <Section title="제6조 (견적 및 결제)">
        <ol className="boda-list">
          <li>견적은 회사가 회원의 요청을 검토한 후 발행하며, 회원의 수락으로 효력이 발생합니다.</li>
          <li>결제는 PayApp을 통해 이루어지며, 결제 완료 시점에 프로젝트가 자동 개시됩니다.</li>
          <li>회원은 결제 전 견적서의 범위·금액·납기를 확인할 책임이 있습니다.</li>
        </ol>
      </Section>

      <Section title="제7조 (작업 진행 및 산출물)">
        <ol className="boda-list">
          <li>회사는 견적서에 명시된 일정에 따라 작업을 진행하며, 회원은 정해진 횟수 내에서 수정을 요청할 수 있습니다.</li>
          <li>최종 산출물의 저작재산권은 결제 완료 시점에 회원에게 양도되며, 회사는 포트폴리오 활용 목적의 표시권을 보유합니다.</li>
          <li>회사가 사용한 AI 도구의 학습 데이터, 폰트, 스톡 이미지 등 제3자 자산의 라이선스는 해당 출처의 약관에 따릅니다.</li>
        </ol>
      </Section>

      <Section title="제8조 (환불 및 취소)">
        <ol className="boda-list">
          <li>작업 착수 전 취소 시 전액 환불됩니다.</li>
          <li>작업 착수 후에는 진행 정도에 따라 부분 환불됩니다.
            <ul className="boda-sublist">
              <li>AI 초안 단계 (~30%): 70% 환불</li>
              <li>디렉팅 단계 (~70%): 30% 환불</li>
              <li>검수 단계 이후: 환불 불가</li>
            </ul>
          </li>
          <li>환불은 결제대행사 정책에 따라 영업일 기준 3–7일 이내에 처리됩니다.</li>
        </ol>
      </Section>

      <Section title="제9조 (회원의 의무)">
        <ol className="boda-list">
          <li>회원은 타인의 권리를 침해하거나 법령을 위반하는 콘텐츠 제작을 요청해서는 안 됩니다.</li>
          <li>회원이 제공한 자료의 저작권·초상권 등 권리 처리 책임은 회원에게 있습니다.</li>
          <li>위반 행위로 인해 발생한 분쟁의 책임은 회원이 부담합니다.</li>
        </ol>
      </Section>

      <Section title="제10조 (계약 해지)">
        <ol className="boda-list">
          <li>회원은 언제든지 마이페이지에서 회원 탈퇴를 요청할 수 있습니다.</li>
          <li>진행 중인 프로젝트가 있는 경우 정산 후 탈퇴가 완료됩니다.</li>
          <li>회사는 회원이 약관을 중대하게 위반한 경우 사전 통지 후 이용을 제한하거나 계약을 해지할 수 있습니다.</li>
        </ol>
      </Section>

      <Section title="제11조 (책임의 제한)">
        <ol className="boda-list">
          <li>회사는 천재지변, 결제대행사 장애 등 회사의 귀책이 아닌 사유로 인한 손해에 대해 책임을 지지 않습니다.</li>
          <li>회원이 잘못된 정보를 제공하거나 검수 의무를 다하지 않아 발생한 손해에 대해서는 책임을 부담하지 않습니다.</li>
        </ol>
      </Section>

      <Section title="제12조 (분쟁 해결)">
        본 약관에 관한 분쟁은 회사 본사 소재지 관할 법원을 1심 관할 법원으로 합니다. 다만,
        제소 당시 회원의 주소 또는 거소가 분명한 경우 회원의 주소 또는 거소를 관할하는 법원을
        관할 법원으로 합니다.
      </Section>

      <p className="mt-12 text-[12px] text-ink-50">
        문의: hello@studioboda.kr · STUDIO BODA · 스튜디오 보다
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
