import type { AIAssetKind } from "@/lib/types/db";
import type { BrandContext, ProjectContext, Rendered } from "./types";

const SYSTEM = `당신은 한국 D2C 브랜드 카피라이터입니다.
규칙:
- 한국어, 미니멀, 직설적, 자극적 단어 금지.
- 결과만 출력 (제목·설명·번호 매기기 없이).
- 항목당 한 줄로 끊고, 줄바꿈으로 구분.
- 브랜드 톤·금지 표현·자주 쓰는 문구를 반드시 반영.`;

const COUNT_BY_KIND: Record<Exclude<AIAssetKind, "brief" | "design_prompt">, number> = {
  copy: 5,
  headline: 5,
  cta: 6,
  description: 3,
};

const LABEL_BY_KIND: Record<Exclude<AIAssetKind, "brief" | "design_prompt">, string> = {
  copy: "광고 카피",
  headline: "헤드라인",
  cta: "CTA 버튼 문구",
  description: "상품/서비스 설명 (2-3문장)",
};

function brandHint(b?: BrandContext | null): string {
  if (!b) return "";
  const rows = [
    b.brandName && `브랜드: ${b.brandName}`,
    b.tone && `톤: ${b.tone}`,
    b.forbiddenExpressions && `금지: ${b.forbiddenExpressions}`,
    b.goToPhrases && `자주 쓰는 문구: ${b.goToPhrases}`,
  ].filter(Boolean) as string[];
  return rows.length ? rows.join(" · ") : "";
}

export function renderCopyPrompt(opts: {
  kind: "copy" | "headline" | "cta" | "description";
  project: ProjectContext;
  brand?: BrandContext | null;
  hint?: string;
}): Rendered {
  const n = COUNT_BY_KIND[opts.kind];
  const label = LABEL_BY_KIND[opts.kind];
  const bh = brandHint(opts.brand);

  const prompt = `대상: ${opts.project.serviceType ?? opts.project.title}
프로젝트: ${opts.project.title}
${bh ? `브랜드 가이드: ${bh}` : ""}
${opts.project.inquiryMessage ? `상황: ${opts.project.inquiryMessage.slice(0, 600)}` : ""}
${opts.hint ? `추가 요구: ${opts.hint.slice(0, 400)}` : ""}

${label} 후보 ${n}개를 한국어로 작성. 각 항목은 한 줄, 줄바꿈으로 구분.`;

  return { system: SYSTEM, prompt };
}
