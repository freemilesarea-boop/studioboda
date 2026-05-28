import { maskPII, maskPIIArray } from "../pii";
import { getServiceFlavor } from "./services";
import type { BrandContext, ProjectContext, Rendered } from "./types";

const SYSTEM = `당신은 STUDIO BODA(스튜디오 보다)의 시니어 크리에이티브 디렉터입니다.
브랜드: AI 자동화 + 디렉터 큐레이션으로 콘텐츠/광고/디자인을 24시간 안에 제작.
응답 규칙:
- 한국어로 작성.
- 마크다운 헤더(##), 불릿(- )만 사용. 표·이모지 금지.
- 추측은 명시 ("⚠️ 미공유 정보:") 후 가설로 적기.
- 자극적/과장된 마케팅 클리셰 금지. 미니멀하고 단정하게.
- 다음 10섹션 구조 그대로 사용:
  ## 제작 목표
  ## 타겟 고객
  ## 브랜드 톤
  ## 핵심 메시지
  ## 금지 표현
  ## 참고 레퍼런스
  ## 디자인 방향
  ## 카피 방향
  ## 산출물 체크리스트
  ## 작업자 주의사항`;

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
  const masked = maskPII(p.inquiryMessage);
  const recent = maskPIIArray(p.recentComments ?? []);
  return [
    `- 프로젝트명: ${p.title}`,
    p.serviceType && `- 서비스: ${p.serviceType}`,
    p.companyName && `- 고객사: ${p.companyName}`,
    p.budget && `- 예산: ${p.budget}`,
    p.deliveryDays && `- 납기: ${p.deliveryDays}일`,
    masked && `- 원본 문의:\n  ${masked.replace(/\n/g, "\n  ")}`,
    p.description && `- 견적 설명:\n  ${maskPII(p.description).replace(/\n/g, "\n  ")}`,
    recent.length > 0
      ? `- 최근 메시지 (오래된 순):\n${recent
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
  const flavor = getServiceFlavor(
    opts.project.serviceKey,
    opts.project.serviceType,
  );

  const prompt = `다음 정보로 ${flavor.serviceLabel} 제작 브리프를 작성해주세요.

## 브랜드 정보
${brandBlock(opts.brand)}

## 프로젝트 정보
${projectBlock(opts.project)}

## 작업 가이드 (이 서비스 타입에 특화)
- 제작 포커스: ${flavor.briefFocus}
- 카피 방향 힌트: ${flavor.copyGuide}
- 디자인 방향 힌트: ${flavor.designGuide}

위 정보로 정확히 10섹션 (## 제작 목표 / 타겟 고객 / 브랜드 톤 / 핵심 메시지 / 금지 표현 / 참고 레퍼런스 / 디자인 방향 / 카피 방향 / 산출물 체크리스트 / 작업자 주의사항) 브리프를 작성해주세요. 추측은 ⚠️로 명시.`;

  return { system: SYSTEM, prompt };
}
