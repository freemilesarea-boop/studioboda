// ============================================================
// STUDIO BODA — Kakao Alimtalk template catalog
// ============================================================
// Template CODE → human title + variable contract + body preview.
// The body text here mirrors what must be REGISTERED & APPROVED in the
// Kakao BizMessage 채널 (알림톡 템플릿 심사). Variables use #{name} which is
// the Kakao Alimtalk substitution syntax. Each template carries 고객명 /
// 프로젝트명 / 금액 / 링크 / CTA per the spec.
// ============================================================

export type KakaoTemplate = {
  code: string;
  title: string;
  /** Required variable keys (#{key}). */
  variables: string[];
  /** Registered Alimtalk body (preview / source for 심사). */
  body: string;
  /** CTA button label shown in the Alimtalk bubble. */
  cta: string;
};

export const KAKAO_TEMPLATES: Record<string, KakaoTemplate> = {
  BODA_QUOTE_SENT: {
    code: "BODA_QUOTE_SENT",
    title: "견적서 도착",
    variables: ["고객명", "프로젝트명", "금액", "링크"],
    body: [
      "[STUDIO BODA] 견적서 도착",
      "",
      "#{고객명}님, 요청하신 #{프로젝트명} 견적서가 발행되었습니다.",
      "견적 금액: #{금액} (VAT 별도)",
      "",
      "아래 버튼에서 견적 내용을 확인해주세요.",
      "#{링크}",
    ].join("\n"),
    cta: "견적서 확인",
  },
  BODA_CONTRACT_SIGN_REQUEST: {
    code: "BODA_CONTRACT_SIGN_REQUEST",
    title: "계약서 서명 요청",
    variables: ["고객명", "프로젝트명", "금액", "링크"],
    body: [
      "[STUDIO BODA] 전자계약서 서명 요청",
      "",
      "#{고객명}님, #{프로젝트명} 전자계약서가 도착했습니다.",
      "계약 금액: #{금액} (VAT 별도)",
      "",
      "계약 내용을 확인하고 전자서명해주세요.",
      "#{링크}",
    ].join("\n"),
    cta: "계약서 확인·서명",
  },
  BODA_DEPOSIT_REQUEST: {
    code: "BODA_DEPOSIT_REQUEST",
    title: "예약금 결제 요청",
    variables: ["고객명", "프로젝트명", "금액", "링크"],
    body: [
      "[STUDIO BODA] 예약금 결제 안내",
      "",
      "#{고객명}님, #{프로젝트명} 예약금 결제를 안내드립니다.",
      "예약금(30%): #{금액}",
      "",
      "결제가 확인되면 제작이 착수됩니다.",
      "#{링크}",
    ].join("\n"),
    cta: "예약금 결제",
  },
  BODA_DEPOSIT_PAID: {
    code: "BODA_DEPOSIT_PAID",
    title: "예약금 결제 완료",
    variables: ["고객명", "프로젝트명", "금액", "링크"],
    body: [
      "[STUDIO BODA] 예약금 결제 완료",
      "",
      "#{고객명}님, #{프로젝트명} 예약금 #{금액} 결제가 정상 완료되었습니다.",
      "계약 서명까지 완료되면 제작이 착수됩니다.",
      "#{링크}",
    ].join("\n"),
    cta: "진행 상황 보기",
  },
  BODA_PROJECT_STARTED: {
    code: "BODA_PROJECT_STARTED",
    title: "프로젝트 착수",
    variables: ["고객명", "프로젝트명", "링크"],
    body: [
      "[STUDIO BODA] 제작 착수",
      "",
      "#{고객명}님, #{프로젝트명} 제작이 착수되었습니다.",
      "진행 상황은 마이페이지에서 확인하실 수 있습니다.",
      "#{링크}",
    ].join("\n"),
    cta: "프로젝트 보기",
  },
  BODA_REVISION_REQUESTED: {
    code: "BODA_REVISION_REQUESTED",
    title: "수정 요청 접수",
    variables: ["고객명", "프로젝트명", "링크"],
    body: [
      "[STUDIO BODA] 수정 요청 접수",
      "",
      "#{고객명}님, #{프로젝트명} 수정 요청이 접수되었습니다.",
      "담당 디렉터가 확인 후 반영합니다.",
      "#{링크}",
    ].join("\n"),
    cta: "요청 내용 보기",
  },
  BODA_FINAL_DELIVERY: {
    code: "BODA_FINAL_DELIVERY",
    title: "결과물 전달",
    variables: ["고객명", "프로젝트명", "링크"],
    body: [
      "[STUDIO BODA] 결과물 전달",
      "",
      "#{고객명}님, #{프로젝트명} 최종 결과물이 전달되었습니다.",
      "마이페이지에서 파일을 다운로드하실 수 있습니다.",
      "#{링크}",
    ].join("\n"),
    cta: "결과물 다운로드",
  },
  BODA_BALANCE_REQUEST: {
    code: "BODA_BALANCE_REQUEST",
    title: "잔금 결제 요청",
    variables: ["고객명", "프로젝트명", "금액", "링크"],
    body: [
      "[STUDIO BODA] 잔금 결제 안내",
      "",
      "#{고객명}님, #{프로젝트명} 잔금 결제를 안내드립니다.",
      "잔금(70%): #{금액}",
      "",
      "결제 후 최종 결과물을 전달드립니다.",
      "#{링크}",
    ].join("\n"),
    cta: "잔금 결제",
  },
};

export function kakaoTemplate(code: string): KakaoTemplate | null {
  return KAKAO_TEMPLATES[code] ?? null;
}
