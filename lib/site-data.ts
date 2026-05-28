export const brand = {
  name: "STUDIO BODA",
  korName: "스튜디오 보다",
  slogan: "See it. Make it. Ship it tomorrow.",
  mainMessage: "당신의 브랜드를 한 번 더 보다.",
  description:
    "AI로 상세페이지, 광고, 콘텐츠를 24시간 안에 완성합니다.",
  email: "hello@studioboda.kr",
  location: "Seoul, KR",
  values: ["VELOCITY", "AESTHETIC", "PERFORMANCE"] as const,
  target: [
    "스마트스토어 셀러",
    "브랜드 대표",
    "자영업자",
    "스타트업",
    "광고대행사",
  ],
};

export const nav = [
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#packages", label: "Packages" },
  { href: "#faq", label: "FAQ" },
];

export const heroDashboard = {
  inProgress: 3,
  completed: 12,
  jobs: [
    {
      title: "상세페이지 · 시즌 SS",
      meta: "DETAIL · BEAUTY",
      status: "렌더링 중",
      progress: 68,
      tone: "iris" as const,
    },
    {
      title: "광고 배너 · 4종",
      meta: "ADS · A/B SET",
      status: "변형 생성",
      progress: 94,
      tone: "sky" as const,
    },
    {
      title: "SNS 카드뉴스",
      meta: "INSTAGRAM · 8 CUT",
      status: "초안 검토 대기",
      progress: 100,
      tone: "plum" as const,
    },
  ],
};

export const brandKeywords = [
  {
    no: "01",
    title: "빠른 제작",
    en: "VELOCITY",
    desc: "AI 자동화 워크플로우로 평균 72시간 → 24시간으로 단축합니다.",
    metric: "AVG. 24H",
  },
  {
    no: "02",
    title: "AI 자동화",
    en: "AUTOMATION",
    desc: "카피, 비주얼, 레이아웃까지 일관된 흐름으로 자동화합니다.",
    metric: "ONE FLOW",
  },
  {
    no: "03",
    title: "고퀄리티 디자인",
    en: "PREMIUM",
    desc: "시니어 디렉터의 큐레이션으로 브랜드 톤을 정제합니다.",
    metric: "CURATED",
  },
  {
    no: "04",
    title: "광고 최적화",
    en: "PERFORMANCE",
    desc: "CTR과 ROAS를 고려한 카피와 레이아웃을 설계합니다.",
    metric: "ROAS UP",
  },
  {
    no: "05",
    title: "브랜드 감각",
    en: "AESTHETIC",
    desc: "템플릿이 아닌 브랜드 고유의 시각 언어를 구현합니다.",
    metric: "UNIQUE",
  },
];

export const services = [
  {
    code: "S01",
    title: "상세페이지 제작",
    en: "DETAIL PAGE",
    desc: "스마트스토어, 자사몰, 쿠팡 등 채널별 최적화된 상세페이지를 설계합니다.",
    bullets: ["채널별 가이드 반영", "후킹 카피 + 비주얼", "전환 최적화 레이아웃"],
  },
  {
    code: "S02",
    title: "SNS 콘텐츠",
    en: "SNS · INSTAGRAM",
    desc: "피드, 릴스, 카드뉴스까지 브랜드 톤이 일관된 콘텐츠 시리즈를 제작합니다.",
    bullets: ["월 단위 콘텐츠 세트", "1:1 / 4:5 / 9:16 대응", "톤앤매너 정제"],
  },
  {
    code: "S03",
    title: "광고 배너",
    en: "PERFORMANCE AD",
    desc: "메타, 구글, 카카오, 네이버까지 채널별 사이즈와 카피 A/B 변형을 제공합니다.",
    bullets: ["CTR 기반 카피", "다채널 사이즈", "A/B 변형 세트"],
  },
  {
    code: "S04",
    title: "썸네일",
    en: "THUMBNAIL · YT",
    desc: "유튜브와 영상 콘텐츠에 최적화된 시선 잡는 썸네일을 제작합니다.",
    bullets: ["CTR 중심 설계", "톤앤매너 가이드", "시리즈 단위 제작"],
  },
  {
    code: "S05",
    title: "브랜드 디자인",
    en: "IDENTITY",
    desc: "로고, 컬러, 타이포그래피 시스템까지 브랜드의 시각 언어를 설계합니다.",
    bullets: ["미니멀 아이덴티티", "운영 가이드 제공", "확장 가능한 시스템"],
  },
];

export const process = [
  {
    step: "01",
    title: "Brief",
    desc: "브랜드, 상품, 목표, 레퍼런스를 정밀하게 수집해 작업 방향을 정의합니다.",
    detail: "Discovery · Goal · Reference",
  },
  {
    step: "02",
    title: "AI Direction",
    desc: "카피, 무드보드, 레이아웃 방향성을 AI로 빠르게 생성하고 검토합니다.",
    detail: "Copy · Moodboard · Layout",
  },
  {
    step: "03",
    title: "Design Curation",
    desc: "AI 결과물을 시니어 디렉터가 선별하고 브랜드 톤에 맞게 정제합니다.",
    detail: "Selection · Refinement",
  },
  {
    step: "04",
    title: "Delivery",
    desc: "상세페이지, 광고 배너, SNS 콘텐츠 등 목적별 산출물을 정리해 전달합니다.",
    detail: "Asset · Spec · Source",
  },
  {
    step: "05",
    title: "Optimization",
    desc: "광고 성과와 사용자 반응을 기반으로 개선안을 제안하고 반영합니다.",
    detail: "Insight · Iterate · Improve",
  },
];

export const portfolio = [
  {
    code: "PF·01",
    title: "Beauty Detail Page",
    category: "Detail Page",
    goal: "신제품 런칭 상세페이지",
    duration: "22h",
    result: "CTR +38% / 체류시간 1.7x",
    palette: ["#5B47FF", "#E6E6EC", "#F6F6FA"],
    accent: "iris",
  },
  {
    code: "PF·02",
    title: "F&B Smartstore",
    category: "Smartstore",
    goal: "단일 상품 매출 확장",
    duration: "18h",
    result: "ROAS 2.4 → 4.1",
    palette: ["#8A6CFF", "#1B1B26", "#F6F6FA"],
    accent: "plum",
  },
  {
    code: "PF·03",
    title: "Fashion Campaign Banner",
    category: "Performance Ad",
    goal: "시즌 캠페인 광고 세트",
    duration: "24h",
    result: "A/B 12종 / CPA -29%",
    palette: ["#0A0A12", "#7C9CFF", "#FFFFFF"],
    accent: "sky",
  },
  {
    code: "PF·04",
    title: "Instagram Carousel",
    category: "SNS Series",
    goal: "월 단위 카드뉴스 세트",
    duration: "20h",
    result: "저장 +112% / 도달 1.9x",
    palette: ["#5B47FF", "#FFFFFF", "#E6E6EC"],
    accent: "iris",
  },
  {
    code: "PF·05",
    title: "YouTube Thumbnail",
    category: "Thumbnail",
    goal: "채널 시리즈 썸네일 8종",
    duration: "12h",
    result: "CTR 4.2% → 8.7%",
    palette: ["#1B1B26", "#5B47FF", "#FFFFFF"],
    accent: "iris",
  },
];

export const packages = [
  {
    name: "Starter",
    en: "PKG · 01",
    summary: "작게 시작하는 콘텐츠 운영",
    items: [
      "SNS 카드뉴스 1세트 (8컷)",
      "썸네일 4종",
      "단일 광고 배너 2종",
      "1차 디렉팅 미팅",
    ],
    note: "콘텐츠 운영을 막 시작한 셀러와 자영업자에게 권장합니다.",
    cta: "견적 문의하기",
    featured: false,
  },
  {
    name: "Growth",
    en: "PKG · 02",
    summary: "전환을 끌어올리는 통합 세트",
    items: [
      "상세페이지 1종",
      "광고 배너 세트 (A/B 6종)",
      "SNS 콘텐츠 세트 (12컷)",
      "성과 리뷰 1회",
    ],
    note: "이미 운영 중인 브랜드의 전환과 매출을 끌어올립니다.",
    cta: "견적 문의하기",
    featured: true,
  },
  {
    name: "Brand Sprint",
    en: "PKG · 03",
    summary: "브랜드 전체를 한 번에",
    items: [
      "상세페이지 + 광고 배너 + SNS 세트",
      "브랜드 비주얼 가이드",
      "시즌 콘텐츠 로드맵",
      "디렉터 전담 운영",
    ],
    note: "런칭 또는 리브랜딩 시점의 브랜드에게 적합합니다.",
    cta: "견적 문의하기",
    featured: false,
  },
];

export const faqs = [
  {
    q: "정말 24시간 안에 가능한가요?",
    a: "네. 표준화된 AI 워크플로우와 디렉터 큐레이션 체계를 통해 평균 24시간 이내 1차 산출물을 전달합니다. 다만 상품 정보와 레퍼런스가 사전에 충분히 공유되어야 하며, 패키지에 따라 일정은 조율됩니다.",
  },
  {
    q: "AI로 만들면 퀄리티가 낮지 않나요?",
    a: "STUDIO BODA는 결과를 그대로 사용하지 않습니다. AI는 빠른 탐색을 위한 도구이며, 모든 산출물은 시니어 디렉터가 브랜드 톤에 맞게 선별하고 정제합니다. 템플릿 디자인과는 다른 결을 보장합니다.",
  },
  {
    q: "상세페이지 원고도 작성해주나요?",
    a: "가능합니다. 상품 USP, 타겟, 채널 특성을 반영한 카피라이팅을 함께 제공합니다. 원고가 이미 있는 경우, 리라이팅과 구조 재설계만 진행하는 옵션도 선택할 수 있습니다.",
  },
  {
    q: "광고 배너 A/B 테스트용 변형도 가능한가요?",
    a: "네. 메인 비주얼, 카피, 배경, 후킹 메시지 등 변수를 나눠 채널별 A/B 변형을 제작합니다. 성과 데이터가 있을 경우 다음 라운드 개선안 제안까지 포함합니다.",
  },
  {
    q: "스마트스토어 셀러도 의뢰 가능한가요?",
    a: "물론입니다. STUDIO BODA의 핵심 타겟 중 하나가 스마트스토어 셀러입니다. 채널 가이드, 모바일 최적화, 전환 흐름까지 고려한 상세페이지를 제작합니다.",
  },
  {
    q: "수정은 몇 회까지 가능한가요?",
    a: "패키지별로 기본 2~3회의 디렉팅 수정을 포함합니다. 컨셉 전면 변경이 아닌 한 추가 수정도 합리적인 비용으로 진행 가능합니다.",
  },
];
