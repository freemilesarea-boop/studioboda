// ============================================================
// STUDIO BODA — Company / Legal identity (single source of truth)
// ============================================================
// Every legally-required business detail lives here so it is edited in
// exactly one place (footer, 약관, 개인정보처리방침 all read from this).
//
// IMPORTANT: Fields that are not yet finalized are `null` ON PURPOSE.
// Do NOT fill them with placeholder/fake values (e.g. "000-00-00000").
// Render surfaces are written to omit any `null` field gracefully, so a
// blank legal number simply does not render until a real value is set.
//
// Before public launch, set the `null` fields below to the real values
// from the 사업자등록증 / 통신판매업 신고증.
// ============================================================

/**
 * Canonical public site URL. Prefers NEXT_PUBLIC_SITE_URL (set per Vercel
 * environment) and falls back to the production domain — kept in sync with
 * `metadataBase` in app/layout.tsx. Used by sitemap.ts / robots.ts.
 */
export const siteUrl: string = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://studioboda.kr"
).replace(/\/+$/, "");

export const company = {
  // Public-safe identity (always shown)
  name: "STUDIO BODA",
  korName: "스튜디오 보다",
  // 사업자등록증상 상호
  legalName: "루베르 콘텐츠 스튜디오",
  email: "contact@swk.today",
  // City-level location is public-safe and may be shown even before the
  // full registered address is finalized.
  locationShort: "Seoul, KR",

  // --- 전자상거래법 표기 의무 항목 ---
  representativeName: "이승현" as string | null, // 대표자명
  businessRegistrationNumber: "234-52-00922" as string | null, // 사업자등록번호
  mailOrderSalesNumber: "2026-서울성동-0724" as string | null, // 통신판매업 신고번호
  phone: null as string | null, // 대표 전화번호 (미등록)
  address: "서울특별시 성동구 왕십리로 326 세신빌딩 6층 614호" as string | null, // 사업장 전체 주소

  // --- 개인정보 보호책임자 (PIPA) ---
  privacyOfficerName: "이승현" as string | null,
  privacyOfficerTitle: "개인정보 보호책임자",
  privacyOfficerEmail: "contact@swk.today",
} as const;

/**
 * Build the one-line business identity string for the footer from whichever
 * legal fields are currently set. Returns "" when none are set yet, so the
 * footer can omit the line entirely instead of rendering placeholders.
 */
export function companyBusinessLine(): string {
  const parts: string[] = [];
  if (company.legalName) parts.push(company.legalName);
  if (company.representativeName) parts.push(`대표 ${company.representativeName}`);
  if (company.businessRegistrationNumber)
    parts.push(`사업자등록번호 ${company.businessRegistrationNumber}`);
  if (company.mailOrderSalesNumber)
    parts.push(`통신판매업 ${company.mailOrderSalesNumber}`);
  return parts.join(" · ");
}

/** Second footer line: 주소 · 이메일 (omits empties). */
export function companyContactLine(): string {
  const parts: string[] = [];
  if (company.address) parts.push(company.address);
  if (company.phone) parts.push(`Tel ${company.phone}`);
  if (company.email) parts.push(company.email);
  return parts.join(" · ");
}

/** True once the core 전자상거래법 fields are filled in. */
export function hasBusinessRegistration(): boolean {
  return Boolean(
    company.representativeName && company.businessRegistrationNumber,
  );
}
