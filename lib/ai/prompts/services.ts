export type ServiceFlavor = {
  serviceLabel: string;
  briefFocus: string;
  copyGuide: string;
  designGuide: string;
};

const FLAVORS: Record<string, ServiceFlavor> = {
  detail: {
    serviceLabel: "상세페이지",
    briefFocus:
      "스크롤 흐름 (Hook → 핵심 가치 → 사용 시나리오 → 신뢰 → CTA) · 모바일 가독성 · 구매 의사결정 단계",
    copyGuide:
      "스크롤 단계별 시선 끄는 문장 · 짧고 단단한 헤드 · 신뢰 요소(후기/스펙) 강조",
    designGuide:
      "modern e-commerce detail page, soft minimal, product hero, lifestyle scene, infographic-style spec",
  },
  sns: {
    serviceLabel: "SNS 콘텐츠 시리즈",
    briefFocus:
      "피드 첫 인상 · 캐러셀 슬라이드 흐름 · 시리즈 일관성 · 저장/공유 유도 포인트",
    copyGuide:
      "한 줄짜리 강한 카피 · 슬라이드 1장당 한 메시지 · 캡션은 짧고 호기심",
    designGuide:
      "instagram feed series, soft pastel, minimal type-driven layout, square 1:1, brand consistency",
  },
  ad: {
    serviceLabel: "광고 배너",
    briefFocus:
      "썸네일 단위 시선 · 1.5초 안 메시지 · A/B 변형 포인트 · 채널 (Meta/Naver/Kakao) 톤",
    copyGuide:
      "후크 한 문장 · 혜택/숫자 강조 · CTA 동사 짧게 · 변형 5개 (혜택형/감성형/숫자형/문제형/CTA형)",
    designGuide:
      "performance ad creative, bold contrast, big number callout, single product hero, mobile-first",
  },
  thumb: {
    serviceLabel: "유튜브/쇼츠 썸네일",
    briefFocus:
      "1초 안에 클릭 유도 · 표정 · 텍스트 가독성 · 채널 톤 유지 · 시리즈 일관성",
    copyGuide:
      "썸네일 텍스트 2-4단어 · 강한 동사 · 숫자/충격 요소 · 욕망/공포/호기심",
    designGuide:
      "youtube thumbnail, high contrast, expressive face, bold sans-serif overlay, dramatic lighting",
  },
  brand: {
    serviceLabel: "브랜드 디자인",
    briefFocus:
      "브랜드 본질 · 컬러 시스템 · 로고 적용 · 톤앤매너 · 운영 가이드",
    copyGuide:
      "브랜드 슬로건 · 한 줄 미션 · 보이스 톤 가이드 (3-5 단어) · 금지/권장 표현",
    designGuide:
      "brand identity system, logo composition, color palette swatch, typography pairing, application mockup",
  },
};

const DEFAULT: ServiceFlavor = {
  serviceLabel: "콘텐츠 제작",
  briefFocus: "프로젝트 목표 · 타겟 · 핵심 메시지",
  copyGuide: "한국 D2C 톤, 미니멀, 직설적",
  designGuide:
    "minimal modern korean brand visual, soft natural lighting, clean composition",
};

export function getServiceFlavor(
  serviceKey?: string | null,
  serviceType?: string | null,
): ServiceFlavor {
  const k = (serviceKey ?? "").toLowerCase();
  if (FLAVORS[k]) return FLAVORS[k];
  const t = (serviceType ?? "").toLowerCase();
  if (t.includes("detail") || t.includes("상세")) return FLAVORS.detail;
  if (t.includes("sns") || t.includes("인스타") || t.includes("릴스") || t.includes("쇼츠"))
    return FLAVORS.sns;
  if (t.includes("ad") || t.includes("광고") || t.includes("배너"))
    return FLAVORS.ad;
  if (t.includes("thumb") || t.includes("썸네일") || t.includes("유튜브"))
    return FLAVORS.thumb;
  if (t.includes("brand") || t.includes("브랜드")) return FLAVORS.brand;
  return DEFAULT;
}
