// ============================================================
// STUDIO BODA — Contract template kinds & recommendation
// ============================================================
// The contract BODY is assembled by the Contract Template Engine
// (lib/contracts/engine.ts) from clause blocks (lib/contracts/blocks.ts).
// This module only holds the template kinds, their labels, and the
// quote→template recommendation rules.
// ============================================================

export type ContractTemplateKind = "website" | "detail_page" | "maintenance";

export const contractTemplateLabels: Record<ContractTemplateKind, string> = {
  website: "웹사이트 제작 계약서",
  detail_page: "상세페이지 제작 계약서",
  maintenance: "유지보수 · 구독 계약서",
};

export const contractTemplateDescriptions: Record<ContractTemplateKind, string> =
  {
    website: "홈페이지·랜딩·쇼핑몰 등 단건 웹사이트 제작 용역",
    detail_page: "상세페이지·SNS·광고 배너 등 콘텐츠 제작 용역",
    maintenance: "월 정기 유지보수 또는 구독형 콘텐츠 운영",
  };

export const CONTRACT_TEMPLATE_KINDS: ContractTemplateKind[] = [
  "website",
  "detail_page",
  "maintenance",
];

/**
 * Recommend a default template from the quote's service type / title /
 * category. Falls back to the most common (detail_page) when unsure.
 */
export function recommendTemplate(input: {
  serviceType?: string | null;
  category?: string | null;
  title?: string | null;
}): ContractTemplateKind {
  const hay = `${input.serviceType ?? ""} ${input.category ?? ""} ${input.title ?? ""}`
    .toLowerCase()
    .replace(/\s+/g, "");
  const has = (...words: string[]) => words.some((w) => hay.includes(w));

  if (
    has("유지보수", "구독", "정기", "운영대행", "관리", "maintenance", "subscription", "retainer")
  ) {
    return "maintenance";
  }
  if (
    has("웹사이트", "홈페이지", "사이트", "랜딩", "landing", "쇼핑몰", "스마트스토어", "website", "web", "개발", "퍼블리싱")
  ) {
    return "website";
  }
  return "detail_page";
}

/** Default included revision rounds per template (used by the 수정 범위 조항). */
export function defaultRevisionCount(kind: ContractTemplateKind): number {
  if (kind === "website") return 3;
  if (kind === "maintenance") return 0;
  return 2;
}

/** Short contract title used as the contract.title. */
export function contractTitleFor(
  kind: ContractTemplateKind,
  projectTitle: string,
): string {
  return `[${contractTemplateLabels[kind]}] ${projectTitle}`;
}
