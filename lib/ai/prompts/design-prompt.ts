import { maskPII } from "../pii";
import { getServiceFlavor } from "./services";
import type { BrandContext, ProjectContext, Rendered } from "./types";

const SYSTEM = `당신은 한국 D2C 브랜드 아트 디렉터입니다.
출력: Midjourney / Firefly / Stable Diffusion / GPT-image 등 이미지 생성기에 바로 넣을 수 있는 영어 프롬프트.
규칙:
- 결과 3개를 "###"로 구분.
- 각 결과는 5줄 구성:
  1줄 [KO] 한국어 한 줄 설명 (디렉터 의도)
  2줄 핵심 장면 영어 키워드 (쉼표 단문)
  3줄 mood/스타일 키워드
  4줄 lighting / lens / colour 키워드
  5줄 negative 키워드 (한 줄, --no 접두 없이)
- markdown header / 번호 매기기 / 자연어 문장 금지.`;

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
  const flavor = getServiceFlavor(
    opts.project.serviceKey,
    opts.project.serviceType,
  );
  const note = maskPII(opts.project.inquiryMessage);
  const prompt = `Project: ${opts.project.title}
Service: ${opts.project.serviceType ?? "content"} (${flavor.serviceLabel})
${brandHint(opts.brand)}
Service style hint: ${flavor.designGuide}
${note ? `Customer note: ${note.slice(0, 400)}` : ""}
${opts.hint ? `Additional direction: ${opts.hint.slice(0, 300)}` : ""}

Generate 3 image-generation prompts following the rules. Remember: each result starts with [KO] Korean intent line.`;
  return { system: SYSTEM, prompt };
}
