import type { BrandContext, ProjectContext, Rendered } from "./types";

const SYSTEM = `당신은 한국 D2C 브랜드 아트 디렉터입니다.
출력: Midjourney / Firefly / Stable Diffusion 등 이미지 생성기에 바로 넣을 수 있는 영어 프롬프트.
규칙:
- 영어, 쉼표로 끊은 단문 단어 묶음. 자연어 문장 금지.
- 첫 줄은 핵심 장면, 두 번째 줄은 mood/스타일, 세 번째 줄은 lighting/lens/colour, 네 번째 줄은 negative 키워드(--no 접두 없이 한 줄).
- 결과 3개를 "###"로 구분. 설명·번호 매기기·markdown header 사용 금지.`;

function brandHint(b?: BrandContext | null): string {
  if (!b) return "";
  const rows = [
    b.brandName && `brand: ${b.brandName}`,
    b.tone && `tone: ${b.tone}`,
    b.brandColors && `palette: ${b.brandColors}`,
    b.referenceSites && `references: ${b.referenceSites}`,
    b.forbiddenExpressions && `avoid: ${b.forbiddenExpressions}`,
  ].filter(Boolean) as string[];
  return rows.join("; ");
}

export function renderDesignPrompt(opts: {
  project: ProjectContext;
  brand?: BrandContext | null;
  hint?: string;
}): Rendered {
  const prompt = `Project: ${opts.project.title}
Service: ${opts.project.serviceType ?? "content"}
${brandHint(opts.brand)}
${opts.project.inquiryMessage ? `Customer note: ${opts.project.inquiryMessage.slice(0, 400)}` : ""}
${opts.hint ? `Additional direction: ${opts.hint.slice(0, 300)}` : ""}

Generate 3 image-generation prompts following the rules.`;
  return { system: SYSTEM, prompt };
}
