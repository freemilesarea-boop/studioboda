export const brand = {
  name: "STUDIO BODA",
  shortName: "BODA",
  korName: "스튜디오 보다",
  slogan: "See it. Make it. Ship it tomorrow.",
  mainMessage: "당신의 브랜드를 한 번 더 보다.",
  description:
    "AI가 초안을 잡고 디렉터가 완성합니다. 상세페이지, 광고, SNS, 썸네일, 브랜드 디자인까지.",
  email: "hello@studioboda.kr",
  location: "Seoul, KR",
  copyright: "© 2026 Studio BODA. All rights reserved.",
};

export const nav = [
  { href: "#services", label: "서비스" },
  { href: "#process", label: "프로세스" },
  { href: "#portfolio", label: "포트폴리오" },
  { href: "#pricing", label: "가격" },
  { href: "#faq", label: "FAQ" },
] as const;

export const heroStats = [
  { num: "2,400", suffix: "+", label: "완료 프로젝트" },
  { num: "98", suffix: "%", label: "고객 만족도" },
  { num: "24", suffix: "h", label: "평균 1차 납기" },
  { num: "70", suffix: "%", label: "비용 절감" },
] as const;

export type Service = {
  key: string;
  icon: string;
  name: string;
  tagline: string;
  desc: string;
  tags: readonly string[];
  price: string;
  featured?: boolean;
  badge?: string;
};

export const services: readonly Service[] = [
  {
    key: "detail",
    icon: "ti-layout-rows",
    name: "상세페이지",
    tagline: "DETAIL PAGE",
    desc: "AI가 제품 정보와 채널 가이드를 분석해 전환율 높은 상세페이지 초안을 생성하고, 디렉터가 톤을 정제합니다.",
    tags: ["스마트스토어", "자사몰", "쿠팡"],
    price: "99,000원~",
    featured: true,
    badge: "인기",
  },
  {
    key: "ad",
    icon: "ti-photo-edit",
    name: "광고 배너",
    tagline: "PERFORMANCE AD",
    desc: "메타·구글·카카오·네이버까지 채널별 사이즈와 A/B 변형을 한 번에. CTR과 ROAS를 고려한 카피와 레이아웃.",
    tags: ["Meta", "Google", "Naver"],
    price: "49,000원~",
  },
  {
    key: "sns",
    icon: "ti-brand-instagram",
    name: "SNS 콘텐츠",
    tagline: "SNS · INSTAGRAM",
    desc: "피드·릴스·카드뉴스까지 브랜드 톤이 일관된 콘텐츠 시리즈. 월 단위 운영도 가능합니다.",
    tags: ["Feed", "Reels", "Carousel"],
    price: "39,000원~",
  },
  {
    key: "thumb",
    icon: "ti-player-play",
    name: "유튜브 썸네일",
    tagline: "THUMBNAIL · YT",
    desc: "유튜브와 영상 콘텐츠에 최적화된 시선 잡는 썸네일. 시리즈 단위로 톤앤매너를 유지합니다.",
    tags: ["YouTube", "Shorts", "Series"],
    price: "29,000원~",
  },
  {
    key: "brand",
    icon: "ti-aperture",
    name: "브랜드 디자인",
    tagline: "IDENTITY",
    desc: "로고·컬러·타이포그래피 시스템까지. 브랜드의 시각 언어를 미니멀하게 설계합니다.",
    tags: ["Logo", "System", "Guideline"],
    price: "290,000원~",
  },
];

export const serviceTabs = [
  { key: "all", label: "전체" },
  { key: "detail", label: "상세페이지" },
  { key: "ad", label: "광고 배너" },
  { key: "sns", label: "SNS" },
  { key: "thumb", label: "썸네일" },
  { key: "brand", label: "브랜드" },
] as const;

export const flowSteps = [
  {
    step: "01",
    icon: "ti-forms",
    title: "Brief",
    desc: "브랜드·상품·목표·레퍼런스를 정밀하게 수집해 작업 방향을 정의합니다.",
  },
  {
    step: "02",
    icon: "ti-cpu",
    title: "AI Direction",
    desc: "카피·무드보드·레이아웃 방향성을 AI가 빠르게 생성하고 검토합니다.",
  },
  {
    step: "03",
    icon: "ti-user-check",
    title: "Curation",
    desc: "AI 결과물을 시니어 디렉터가 선별·정제해 브랜드 톤을 완성합니다.",
  },
  {
    step: "04",
    icon: "ti-download",
    title: "Delivery",
    desc: "목적별 산출물과 스펙·소스를 정리해 24시간 안에 전달합니다.",
  },
] as const;

export const aiFeatures = [
  {
    icon: "ti-brain",
    title: "브랜드 보이스 학습",
    desc: "기존 자료를 업로드하면 AI가 브랜드 톤앤매너를 분석해 일관된 문체로 제작합니다.",
  },
  {
    icon: "ti-chart-bar",
    title: "전환율 기반 카피",
    desc: "카테고리별 전환 데이터를 학습해 후킹 카피와 CTA 패턴을 자동으로 제안합니다.",
  },
  {
    icon: "ti-search",
    title: "SEO 자동 최적화",
    desc: "키워드·메타·구조까지 채널별 가이드에 맞춰 검색 최적화 형태로 생성합니다.",
  },
  {
    icon: "ti-arrows-right-left",
    title: "멀티포맷 변환",
    desc: "한 번 만든 콘텐츠를 1:1·4:5·9:16·16:9 등 채널별 포맷으로 자동 변환합니다.",
  },
] as const;

export type PortfolioMetric = { label: string; value: string };

export type PortfolioItem = {
  code: string;
  cat: string;
  catKey: string;
  title: string;
  summary: string;
  client: string;
  sector: string;
  channels: readonly string[];
  metrics: readonly PortfolioMetric[];
  shipped: string;
  duration: string;
  rating: string;
  status: "Live" | "Shipped" | "Ongoing";
  bg: string;
  fg: string;
  label: string;
};

export const portfolio: readonly PortfolioItem[] = [
  {
    code: "PF·01",
    cat: "상세페이지",
    catKey: "detail",
    title: "비건 스킨케어 세럼 런칭 페이지",
    summary: "신제품 출시 상세페이지 · 모바일 우선 설계",
    client: "AURA",
    sector: "Beauty · D2C",
    channels: ["Smartstore", "자사몰"],
    metrics: [
      { label: "CTR", value: "+38%" },
      { label: "체류", value: "1.7×" },
      { label: "제작", value: "22h" },
    ],
    shipped: "2026 · Mar",
    duration: "22h",
    rating: "5.0",
    status: "Live",
    bg: "#EEEEFF",
    fg: "#5847FF",
    label: "DETAIL · BEAUTY",
  },
  {
    code: "PF·02",
    cat: "광고 배너",
    catKey: "ad",
    title: "SS 시즌 캠페인 광고 배너 12종",
    summary: "Meta · GDN · Naver 채널별 A/B 12 variants",
    client: "MOEL",
    sector: "Fashion",
    channels: ["Meta", "GDN", "Naver"],
    metrics: [
      { label: "CPA", value: "−29%" },
      { label: "CTR", value: "+44%" },
      { label: "변형", value: "12종" },
    ],
    shipped: "2026 · Mar",
    duration: "24h",
    rating: "4.9",
    status: "Live",
    bg: "#F3EEFF",
    fg: "#7C3AED",
    label: "ADS · FASHION",
  },
  {
    code: "PF·03",
    cat: "SNS",
    catKey: "sns",
    title: "F&B 브랜드 인스타 콘텐츠 시리즈",
    summary: "월 단위 카드뉴스 + 릴스 · 톤앤매너 통합",
    client: "PIVOT",
    sector: "F&B",
    channels: ["Instagram", "Reels"],
    metrics: [
      { label: "저장", value: "+112%" },
      { label: "도달", value: "1.9×" },
      { label: "운영", value: "월 단위" },
    ],
    shipped: "2026 · Feb",
    duration: "20h",
    rating: "5.0",
    status: "Ongoing",
    bg: "#EDFFF4",
    fg: "#16A34A",
    label: "SNS · F&B",
  },
  {
    code: "PF·04",
    cat: "썸네일",
    catKey: "thumb",
    title: "유튜브 채널 시리즈 썸네일 8종",
    summary: "CTR 중심 비주얼 + 시리즈 톤 일관성",
    client: "STILL",
    sector: "Lifestyle",
    channels: ["YouTube", "Shorts"],
    metrics: [
      { label: "CTR", value: "8.7%" },
      { label: "이전", value: "4.2%" },
      { label: "제작", value: "12h" },
    ],
    shipped: "2026 · Feb",
    duration: "12h",
    rating: "5.0",
    status: "Shipped",
    bg: "#EEF4FF",
    fg: "#2563EB",
    label: "THUMB · YT",
  },
  {
    code: "PF·05",
    cat: "브랜드",
    catKey: "brand",
    title: "D2C 리빙 브랜드 아이덴티티",
    summary: "로고 · 컬러 · 타이포 · 운영 가이드 전체",
    client: "TONE",
    sector: "Living",
    channels: ["Identity", "Guideline"],
    metrics: [
      { label: "범위", value: "Full" },
      { label: "가이드", value: "48p" },
      { label: "제작", value: "5d" },
    ],
    shipped: "2026 · Jan",
    duration: "5d",
    rating: "5.0",
    status: "Live",
    bg: "#FFF2EE",
    fg: "#EA580C",
    label: "BRAND · LIVING",
  },
  {
    code: "PF·06",
    cat: "상세페이지",
    catKey: "detail",
    title: "건강식품 스마트스토어 단일 상품 페이지",
    summary: "단일 SKU 매출 확장 · 모바일 전환 흐름",
    client: "DAILY BREW",
    sector: "Health · F&B",
    channels: ["Smartstore", "Coupang"],
    metrics: [
      { label: "ROAS", value: "4.1×" },
      { label: "이전", value: "2.4×" },
      { label: "제작", value: "18h" },
    ],
    shipped: "2026 · Jan",
    duration: "18h",
    rating: "4.9",
    status: "Live",
    bg: "#FFFBEE",
    fg: "#CA8A04",
    label: "DETAIL · F&B",
  },
];

export const quoteOptions = {
  service: [
    { key: "detail", label: "상세페이지", base: 99000 },
    { key: "ad", label: "광고 배너 세트", base: 49000 },
    { key: "sns", label: "SNS 카드뉴스 세트", base: 39000 },
    { key: "thumb", label: "유튜브 썸네일", base: 29000 },
    { key: "brand", label: "브랜드 디자인", base: 290000 },
  ],
  delivery: [
    { key: "normal", label: "보통 (3-5일)", multiplier: 1 },
    { key: "fast", label: "빠른 납품 (1-2일)", multiplier: 1.3 },
    { key: "easy", label: "여유 (7일 이상)", multiplier: 0.9 },
  ],
  addons: [
    { key: "english", label: "영문 버전", price: 30000 },
    { key: "multi", label: "멀티포맷 변환", price: 50000 },
    { key: "copy", label: "카피라이팅 포함", price: 40000 },
    { key: "ab", label: "A/B 변형 추가", price: 35000 },
  ],
} as const;

export type JobState = "rendering" | "review" | "export" | "done";

export type DashboardJob = {
  id: string;
  icon: string;
  title: string;
  sub: string;
  client: string;
  progress: number;
  status: string;
  state: JobState;
  eta: string;
};

export const dashboardJobs: readonly DashboardJob[] = [
  {
    id: "#BODA-2841",
    icon: "ti-layout-rows",
    title: "비건 세럼 상세페이지",
    sub: "AI 초안 완성 → 디자이너 정제 중",
    client: "AURA · Beauty D2C",
    progress: 68,
    status: "RENDERING",
    state: "rendering",
    eta: "D-1 · 22h",
  },
  {
    id: "#BODA-2839",
    icon: "ti-photo-edit",
    title: "SS 시즌 광고 배너 12종",
    sub: "A/B 카피 6/12 생성 완료",
    client: "MOEL · Fashion",
    progress: 94,
    status: "RENDERING",
    state: "rendering",
    eta: "오늘 · 4h",
  },
  {
    id: "#BODA-2836",
    icon: "ti-brand-instagram",
    title: "인스타 카드뉴스 8컷",
    sub: "디렉터 검수 단계",
    client: "PIVOT · F&B",
    progress: 100,
    status: "IN REVIEW",
    state: "review",
    eta: "12분 후",
  },
  {
    id: "#BODA-2828",
    icon: "ti-player-play",
    title: "유튜브 썸네일 시리즈 8종",
    sub: "에셋 내보내는 중",
    client: "STILL · Lifestyle",
    progress: 100,
    status: "EXPORT",
    state: "export",
    eta: "곧 납품",
  },
  {
    id: "#BODA-2820",
    icon: "ti-aperture",
    title: "리빙 브랜드 비주얼 가이드",
    sub: "납품 완료 · 운영 단계",
    client: "TONE · Living",
    progress: 100,
    status: "DELIVERED",
    state: "done",
    eta: "3일 전",
  },
];

export const heroQueue = {
  rendering: 2,
  review: 1,
  exporting: 1,
  doneToday: 8,
};

export type ActivityEvent = {
  time: string;
  type: "ai" | "director" | "export" | "client" | "queue";
  message: string;
  meta?: string;
};

export const activityFeed: readonly ActivityEvent[] = [
  {
    time: "12:08",
    type: "ai",
    message: "AI가 SS 시즌 광고 배너 A/B 변형 6종을 생성했습니다.",
    meta: "#BODA-2839",
  },
  {
    time: "11:52",
    type: "director",
    message: "디렉터 J가 ‘비건 세럼 상세페이지’ 1차 시안을 승인했습니다.",
    meta: "#BODA-2841",
  },
  {
    time: "11:30",
    type: "export",
    message: "유튜브 썸네일 8종이 내보내기 큐에 추가되었습니다.",
    meta: "1.2GB · 8 assets",
  },
  {
    time: "10:14",
    type: "client",
    message: "AURA 팀이 컨셉 B에 코멘트 3건을 남겼습니다.",
    meta: "#BODA-2841",
  },
  {
    time: "09:02",
    type: "queue",
    message: "오늘 납기 예정 4건이 자동 우선순위로 정렬되었습니다.",
    meta: "AVG · 24H",
  },
];

export type Export = {
  title: string;
  format: string;
  size: string;
  bg: string;
  fg: string;
  label: string;
};

export const recentExports: readonly Export[] = [
  {
    title: "비건 세럼 · Hero KV",
    format: "PNG · 2160×2700",
    size: "4.1MB",
    bg: "#EEEEFF",
    fg: "#5847FF",
    label: "DETAIL",
  },
  {
    title: "SS 캠페인 · Banner A",
    format: "JPG · 1080×1080",
    size: "1.2MB",
    bg: "#F3EEFF",
    fg: "#7C3AED",
    label: "ADS",
  },
  {
    title: "F&B · Carousel 03",
    format: "PNG · 1080×1350",
    size: "2.4MB",
    bg: "#EDFFF4",
    fg: "#16A34A",
    label: "SNS",
  },
  {
    title: "STILL · Thumb 05",
    format: "JPG · 1280×720",
    size: "0.8MB",
    bg: "#EEF4FF",
    fg: "#2563EB",
    label: "YT",
  },
];

export type SidebarItem = {
  icon: string;
  label: string;
  active?: boolean;
};

export const dashboardSidebar: readonly SidebarItem[] = [
  { icon: "ti-layout-dashboard", label: "대시보드", active: true },
  { icon: "ti-file-text", label: "내 주문" },
  { icon: "ti-folders", label: "에셋 라이브러리" },
  { icon: "ti-messages", label: "디렉터 메시지" },
  { icon: "ti-settings", label: "설정" },
];

export const trustStats = [
  { num: "2,400", suffix: "+", label: "누적 완료 프로젝트" },
  { num: "320", suffix: "+", label: "거래 브랜드 수" },
  { num: "98", suffix: "%", label: "재의뢰율" },
  { num: "24", suffix: "h", label: "평균 1차 납기" },
] as const;

export const reviews = [
  {
    initials: "박*연",
    role: "뷰티 브랜드 대표",
    badge: "상세페이지",
    body: "AI가 초안을 이렇게 빠르게 잡아줄 줄 몰랐어요. 디렉터분이 마무리해 주시니 브랜드 톤도 살아 있고, 무엇보다 CTR이 눈에 띄게 올랐어요.",
    rating: "5.0",
  },
  {
    initials: "이*훈",
    role: "스마트스토어 셀러",
    badge: "광고 배너",
    body: "A/B 12종을 24시간 만에 받았는데, 단순한 사이즈 변형이 아니라 카피와 후킹 방식이 다 달라서 실제로 CPA가 30% 가까이 줄었습니다.",
    rating: "5.0",
  },
  {
    initials: "정*아",
    role: "라이프스타일 스타트업 CMO",
    badge: "브랜드 디자인",
    body: "에이전시 견적의 1/3로 풀 브랜드 시스템을 받았는데, 결과물은 오히려 더 정돈되어 있어요. 운영 가이드까지 받아 바로 적용했습니다.",
    rating: "5.0",
  },
] as const;

export type PricingPlan = {
  name: string;
  sub: string;
  price: string;
  unit: string;
  items: readonly string[];
  cta: string;
  featured: boolean;
  badge?: string;
};

export const pricing: readonly PricingPlan[] = [
  {
    name: "Starter",
    sub: "콘텐츠 운영을 시작하는 셀러",
    price: "190,000",
    unit: "원/월",
    items: [
      "월 2건 제작 포함",
      "SNS · 썸네일 · 단일 배너",
      "기본 수정 2회",
      "이메일 응대",
    ],
    cta: "Starter 시작하기",
    featured: false,
  },
  {
    name: "Pro",
    sub: "성장 중인 브랜드·스타트업",
    price: "390,000",
    unit: "원/월",
    items: [
      "월 5건 제작 포함",
      "상세페이지 · 광고 · SNS 통합",
      "디렉팅 수정 3회",
      "퍼포먼스 리뷰 1회",
      "전용 디렉터 매칭",
    ],
    cta: "Pro 시작하기",
    featured: true,
    badge: "가장 인기",
  },
  {
    name: "Brand Sprint",
    sub: "런칭·리브랜딩 단위 패키지",
    price: "견적 문의",
    unit: "",
    items: [
      "상세페이지 + 광고 + SNS 풀세트",
      "브랜드 비주얼 시스템",
      "시즌 콘텐츠 로드맵",
      "디렉터 전담 운영",
      "성과 기반 개선 제안",
    ],
    cta: "견적 문의하기",
    featured: false,
  },
];

export const enterprise = {
  title: "Enterprise · 운영 단위 파트너십",
  sub: "월 10건 이상의 콘텐츠 운영, 멀티브랜드, 광고대행사 화이트라벨까지. 전담 디렉터 + 운영 매니저 + 우선 큐로 운영합니다.",
  bullets: [
    "전담 디렉터 + 운영 매니저",
    "우선 큐 (Priority Queue)",
    "전용 작업실 채널 · 보안 NDA",
    "주간 퍼포먼스 리포트",
    "API · 워크플로우 연동 지원",
  ],
  cta: "Enterprise 상담 신청",
};

export const faqs = [
  {
    q: "정말 24시간 안에 가능한가요?",
    a: "네. 표준화된 AI 워크플로우와 디렉터 큐레이션 체계를 통해 평균 24시간 이내 1차 산출물을 전달합니다. 상품 정보와 레퍼런스가 사전에 충분히 공유되어야 하며, 패키지에 따라 일정은 조율됩니다.",
  },
  {
    q: "AI로 만들면 퀄리티가 낮지 않나요?",
    a: "STUDIO BODA는 AI 결과를 그대로 사용하지 않습니다. AI는 빠른 탐색을 위한 도구이며, 모든 산출물은 시니어 디렉터가 브랜드 톤에 맞게 선별하고 정제합니다. 템플릿 디자인과는 다른 결을 보장합니다.",
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
] as const;

export const footerLinks = [
  {
    title: "서비스",
    items: [
      { label: "상세페이지", href: "#services" },
      { label: "광고 배너", href: "#services" },
      { label: "SNS 콘텐츠", href: "#services" },
      { label: "유튜브 썸네일", href: "#services" },
      { label: "브랜드 디자인", href: "#services" },
    ],
  },
  {
    title: "전문 분야",
    items: [
      { label: "Beauty · D2C", href: "#portfolio" },
      { label: "Fashion · Apparel", href: "#portfolio" },
      { label: "F&B · Health", href: "#portfolio" },
      { label: "Lifestyle · Living", href: "#portfolio" },
      { label: "B2B · SaaS", href: "#portfolio" },
    ],
  },
  {
    title: "리소스",
    items: [
      { label: "포트폴리오", href: "#portfolio" },
      { label: "제작 프로세스", href: "#process" },
      { label: "가격 정책", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "견적 계산기", href: "#quote" },
    ],
  },
  {
    title: "스튜디오",
    items: [
      { label: "문의하기", href: "#contact" },
      { label: "Enterprise", href: "#pricing" },
      { label: "대시보드", href: "#dashboard" },
      { label: "hello@studioboda.kr", href: "mailto:hello@studioboda.kr" },
    ],
  },
] as const;

export const footerMeta = {
  status: "운영 중 · 평균 회신 24시간 이내",
  hq: "Seoul, KR · KST (UTC+9)",
  business: "사업자번호 000-00-00000",
  privacy: "개인정보 보호 · SSL 보안 · NDA 가능",
};

export type Portfolio = (typeof portfolio)[number];
export type Pricing = PricingPlan;
