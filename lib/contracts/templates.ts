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

// ============================================================
// 용역계약서 — 단일 제목 + 업무 범위 체크리스트
// ============================================================
// The contract is ALWAYS titled "용역계약서". The actual service is expressed
// in the 업무 범위 checklist (한 항목에 ● 표시) so a misclassified template
// title can never happen. `serviceScopeKey` maps free-text service_type/title
// to one canonical scope row.

export type ServiceScopeKey =
  | "website"
  | "detail_page"
  | "sns"
  | "ad_banner"
  | "brand_design"
  | "ai_content"
  | "maintenance"
  | "etc";

/** Ordered work-scope rows shown on every 용역계약서. */
export const SERVICE_SCOPE_ROWS: { key: ServiceScopeKey; label: string }[] = [
  { key: "website", label: "웹사이트 / 랜딩페이지 / 쇼핑몰 제작" },
  { key: "detail_page", label: "상세페이지 제작" },
  { key: "sns", label: "SNS 콘텐츠 제작" },
  { key: "ad_banner", label: "광고 배너 제작" },
  { key: "brand_design", label: "브랜드 디자인" },
  { key: "ai_content", label: "AI 콘텐츠 제작" },
  { key: "maintenance", label: "유지보수 / 운영" },
  { key: "etc", label: "기타" },
];

/**
 * Classify a quote's service_type/title/category into ONE work-scope key.
 * Order matters: most specific first. Never throws; defaults to "etc".
 */
export function serviceScopeKey(input: {
  serviceType?: string | null;
  category?: string | null;
  title?: string | null;
}): ServiceScopeKey {
  const hay = `${input.serviceType ?? ""} ${input.category ?? ""} ${input.title ?? ""}`
    .toLowerCase()
    .replace(/\s+/g, "");
  const has = (...w: string[]) => w.some((x) => hay.includes(x.toLowerCase()));

  if (has("유지보수", "구독", "정기", "운영대행", "운영", "관리", "maintenance", "subscription", "retainer"))
    return "maintenance";
  // SNS BEFORE detail_page/ad so 'SNS 콘텐츠'는 detail로 빠지지 않음
  if (has("sns", "인스타", "instagram", "피드", "릴스", "reels", "카드뉴스", "유튜브", "youtube", "쇼츠", "shorts", "틱톡", "tiktok", "썸네일", "thumbnail"))
    return "sns";
  if (has("광고배너", "광고", "배너", "메타광고", "네이버광고", "카카오광고", "ad", "banner", "gdn", "퍼포먼스"))
    return "ad_banner";
  // Website BEFORE brand so "브랜드 웹사이트"는 website로 분류됨.
  if (has("웹사이트", "홈페이지", "사이트", "랜딩", "landing", "쇼핑몰", "스마트스토어", "website", "web", "개발", "퍼블리싱"))
    return "website";
  if (has("ai콘텐츠", "ai생성", "ai이미지", "생성형", "aigenerated"))
    return "ai_content";
  if (has("브랜드", "로고", "ci", "bi", "brand", "아이덴티티", "패키지"))
    return "brand_design";
  if (has("상세페이지", "상세", "제품상세", "쇼핑몰상세", "detail"))
    return "detail_page";
  return "etc";
}

/**
 * Map a work-scope to the clause template kind. website/maintenance keep their
 * specialized clauses; everything else uses the general content (detail_page)
 * clause set. (Clause selection only — NOT the title.)
 */
export function scopeToTemplateKind(scope: ServiceScopeKey): ContractTemplateKind {
  if (scope === "website") return "website";
  if (scope === "maintenance") return "maintenance";
  return "detail_page";
}

/** Build the 업무 범위 checklist block with ● on the matched scope. */
export function workScopeChecklist(active: ServiceScopeKey): string {
  return SERVICE_SCOPE_ROWS.map(
    (r) => `${r.key === active ? "[●]" : "[ ]"} ${r.label}`,
  ).join("\n");
}

/** Backwards-compatible recommend (now scope-driven). */
export function recommendTemplateFromScope(input: {
  serviceType?: string | null;
  category?: string | null;
  title?: string | null;
}): ContractTemplateKind {
  return scopeToTemplateKind(serviceScopeKey(input));
}

/**
 * Contract title — ALWAYS "용역계약서" regardless of service. The service is
 * shown in the 계약명(견적 제목) + 업무 범위 체크리스트.
 */
export function contractTitleFor(
  _kind: ContractTemplateKind,
  projectTitle: string,
): string {
  return `용역계약서 · ${projectTitle}`;
}
