import type { BrandContext, ProjectContext, Rendered } from "./types";

const SYSTEM = `당신은 STUDIO BODA(스튜디오 보다)의 시니어 크리에이티브 디렉터입니다.
브랜드: AI 자동화 + 디렉터 큐레이션으로 콘텐츠/광고/디자인을 24시간 안에 제작.
응답 규칙:
- 한국어로 작성.
- 마크다운 헤더(##), 불릿(- )만 사용. 표·이모지 금지.
- 추측은 명시 ("⚠️ 미공유 정보:") 후 가설로 적기.
- 자극적/과장된 마케팅 클리셰 금지. 미니멀하고 단정하게.
- 5섹션 구조: ## 목표 / ## 브랜드 톤 / ## 핵심 메시지 / ## 산출물 구성 / ## 제작 노트.`;

function brandBlock(b?: BrandContext | null): string {
  if (!b) return "(브랜드 자산 미공유)";
  const rows = [
    b.brandName && `- 브랜드: ${b.brandName}`,
    b.brandColors && `- 컬러: ${b.brandColors}`,
    b.referenceSites && `- 참고 사이트: ${b.referenceSites}`,
    b.tone && `- 톤앤매너: ${b.tone}`,
    b.forbiddenExpressions && `- 금지 표현: ${b.forbiddenExpressions}`,
    b.goToPhrases && `- 자주 쓰는 문구: ${b.goToPhrases}`,
    b.notes && `- 메모: ${b.notes}`,
  ].filter(Boolean);
  return rows.length ? rows.join("\n") : "(브랜드 자산 비어 있음)";
}

function projectBlock(p: ProjectContext): string {
  return [
    `- 프로젝트명: ${p.title}`,
    p.serviceType && `- 서비스: ${p.serviceType}`,
    p.companyName && `- 고객사: ${p.companyName}`,
    p.customerName && `- 담당 고객: ${p.customerName}`,
    p.budget && `- 예산: ${p.budget}`,
    p.deliveryDays && `- 납기: ${p.deliveryDays}일`,
    p.inquiryMessage && `- 원본 문의:\n  ${p.inquiryMessage.replace(/\n/g, "\n  ")}`,
    p.description && `- 견적 설명:\n  ${p.description.replace(/\n/g, "\n  ")}`,
    p.recentComments && p.recentComments.length > 0
      ? `- 최근 메시지 (오래된 순):\n${p.recentComments
          .slice(0, 5)
          .map((c) => `  · ${c.slice(0, 240)}`)
          .join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderBriefPrompt(opts: {
  project: ProjectContext;
  brand?: BrandContext | null;
}): Rendered {
  const service = (opts.project.serviceKey ?? opts.project.serviceType ?? "").toLowerCase();
  const flavor = service.includes("detail")
    ? "상세페이지"
    : service.includes("sns")
    ? "SNS 콘텐츠 시리즈"
    : service.includes("ad")
    ? "광고 배너"
    : service.includes("thumb")
    ? "유튜브/쇼츠 썸네일"
    : service.includes("brand")
    ? "브랜드 디자인"
    : opts.project.serviceType ?? "콘텐츠 제작";

  const prompt = `다음 정보로 ${flavor} 제작 브리프를 작성해주세요.

## 브랜드 정보
${brandBlock(opts.brand)}

## 프로젝트 정보
${projectBlock(opts.project)}

위 정보로 5섹션 브리프를 한국어로 작성해주세요. 추측은 명시.`;

  return { system: SYSTEM, prompt };
}
