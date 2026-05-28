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

export type ServiceTabKey = "all" | "detail" | "deck" | "shorts" | "package";

export type Service = {
  key: string;
  tabKey: Exclude<ServiceTabKey, "all">;
  icon: string;
  name: string;
  desc: string;
  tags: readonly string[];
  priceLabel?: string;
  price: string;
  featured?: boolean;
  badge?: string;
};

export const services: readonly Service[] = [
  {
    key: "detail",
    tabKey: "detail",
    icon: "ti-layout-rows",
    name: "상세페이지",
    desc: "AI가 제품 정보를 분석해 구매 전환율 높은 상세페이지 초안을 생성합니다. 스마트스토어, 쿠팡, 자사몰 최적화.",
    tags: ["스마트스토어", "쿠팡", "자사몰"],
    price: "99,000원~",
    featured: true,
    badge: "인기",
  },
  {
    key: "deck",
    tabKey: "deck",
    icon: "ti-presentation",
    name: "회사소개서",
    desc: "기업 강점과 수치를 바탕으로 투자자, 파트너, 고객을 설득하는 전문 소개서를 제작합니다.",
    tags: ["PPT", "PDF", "웹슬라이드"],
    price: "149,000원~",
  },
  {
    key: "shorts",
    tabKey: "shorts",
    icon: "ti-video",
    name: "쇼츠 · 릴스",
    desc: "AI 스크립트 작성부터 자막, 편집까지. 알고리즘 최적화된 숏폼 콘텐츠를 빠르게 제작합니다.",
    tags: ["유튜브", "인스타", "틱톡"],
    price: "79,000원~",
  },
  {
    key: "brand-pkg",
    tabKey: "package",
    icon: "ti-package",
    name: "브랜드 패키지",
    desc: "상세페이지 + 소개서 + 영상 3종을 일관된 브랜드 메시지로 제작하는 풀패키지 서비스.",
    tags: ["신규 브랜드", "리브랜딩"],
    price: "280,000원~",
  },
  {
    key: "renewal",
    tabKey: "package",
    icon: "ti-refresh",
    name: "콘텐츠 리뉴얼",
    desc: "기존 자료를 AI가 분석해 전환율·가독성 개선 포인트를 찾고 업그레이드합니다.",
    tags: ["A/B 테스트", "데이터 기반"],
    price: "59,000원~",
  },
  {
    key: "subscription",
    tabKey: "package",
    icon: "ti-calendar",
    name: "정기 구독",
    desc: "매월 정해진 수량의 콘텐츠를 전담 팀이 지속 제작. 브랜드 일관성과 비용 절감을 동시에.",
    tags: ["월 구독", "전담 팀"],
    priceLabel: "월",
    price: "390,000원~",
  },
];

export const serviceTabs: readonly { key: ServiceTabKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "detail", label: "상세페이지" },
  { key: "deck", label: "회사소개서" },
  { key: "shorts", label: "쇼츠·릴스" },
  { key: "package", label: "패키지" },
];

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

export type ClientLogo = {
  name: string;
  sector: string;
  treatment?: "wordmark" | "monogram";
};

export const clientLogos: readonly ClientLogo[] = [
  { name: "AURA", sector: "Beauty" },
  { name: "MOEL", sector: "Fashion" },
  { name: "PIVOT", sector: "F&B" },
  { name: "STILL", sector: "Lifestyle" },
  { name: "TONE", sector: "Living" },
  { name: "DAILY BREW", sector: "F&B" },
  { name: "FOLD", sector: "Apparel" },
  { name: "NORTH↑", sector: "Outdoor" },
  { name: "POINT.", sector: "Studio" },
  { name: "HALO", sector: "Beauty" },
  { name: "BLOOM&", sector: "Floral" },
  { name: "ANCHOR", sector: "B2B" },
  { name: "BAEK", sector: "Heritage" },
  { name: "OAK·CO", sector: "Furniture" },
  { name: "FERRY", sector: "Travel" },
  { name: "CALM", sector: "Health" },
];

export const clientStats = {
  totalBrands: "320+",
  byCategory: [
    { label: "Beauty · D2C", value: 64 },
    { label: "Fashion · Apparel", value: 48 },
    { label: "F&B · Health", value: 72 },
    { label: "Lifestyle · Living", value: 56 },
    { label: "B2B · SaaS", value: 32 },
    { label: "Agency · Partner", value: 48 },
  ],
};

export type PortfolioMetric = { label: string; value: string };

export type CaseStudyDetail = {
  goal: string;
  result: string;
  duration: string;
  channels: readonly string[];
  process: readonly string[];
  aiPipeline: readonly string[];
  before: {
    label: string;
    note: string;
  };
  after: {
    label: string;
    note: string;
  };
  extraMetrics?: readonly PortfolioMetric[];
};

export const caseStudies: Record<string, CaseStudyDetail> = {
  "PF·01": {
    goal: "신규 SKU 런칭 시 모바일 상세페이지 전환율 확보 · 비건/저자극 USP 명확화",
    result:
      "공개 첫 주 CTR 38% 상승, 평균 체류시간 1.7× 증가. 후속 시즌 페이지 운영도 BODA로 이관.",
    duration: "22h · D-1 납품",
    channels: ["Smartstore", "자사몰 · 모바일 우선"],
    process: [
      "브리프 · 상품 정보 · 유효 키워드 수집",
      "AI가 후킹 카피 5종 + 무드보드 3종 생성",
      "디렉터 J · 톤 정제 및 모바일 그리드 재구성",
      "라이브 후 일주일 데이터 기반 미세 조정",
    ],
    aiPipeline: ["Copy v4.2", "Moodboard", "Layout 9:16", "SEO meta"],
    before: { label: "기존 페이지", note: "롱폼 + 텍스트 위주, 모바일 그리드 깨짐" },
    after: {
      label: "BODA 리뉴얼",
      note: "키비주얼 우선 · 후킹 카피 + USP 모듈 4개",
    },
  },
  "PF·02": {
    goal: "SS 시즌 캠페인 · Meta/GDN/Naver 채널별 사이즈와 카피 A/B 검증",
    result:
      "CPA 29% 절감, CTR 44% 상승. 채널별 best 변형을 정리해 다음 시즌 운영 가이드로 사용.",
    duration: "24h · A/B 12종",
    channels: ["Meta", "Google · GDN", "Naver"],
    process: [
      "이전 캠페인 데이터 분석 · 후킹 패턴 추출",
      "AI 카피 12종 + 비주얼 변형 4종 생성",
      "디렉터 K · 채널별 best 6종 선별",
      "런칭 후 48시간 데이터로 A/B 정리",
    ],
    aiPipeline: ["Copy A/B", "Channel sizing", "CTR predict", "Asset bundle"],
    before: { label: "이전 캠페인", note: "단일 비주얼 · CPA 18,000원" },
    after: { label: "BODA 변형", note: "A/B 12종 · CPA 12,700원" },
  },
  "PF·03": {
    goal: "월 단위 인스타 운영의 톤 일관성 + 저장 유도 콘텐츠 비중 확대",
    result:
      "저장 +112%, 도달 1.9×. 시즌별 카드뉴스 운영을 정기화로 확장.",
    duration: "20h · 8 카드 + 2 릴스",
    channels: ["Instagram", "Reels"],
    process: [
      "기존 피드 톤앤매너 회수 · 컬러/타이포 정리",
      "AI가 시리즈 시안 12종 생성",
      "디렉터 H · 8컷 시리즈로 큐레이션 + 릴스 스크립트",
      "발행 후 저장률 기반 시리즈 추가",
    ],
    aiPipeline: ["Series moodboard", "Carousel 1:1 / 4:5", "Reels script"],
    before: { label: "기존 운영", note: "단발성 게시 · 저장률 0.8%" },
    after: { label: "BODA 시리즈", note: "톤 통합 · 저장률 1.7%" },
  },
  "PF·04": {
    goal: "유튜브 시리즈 썸네일 톤 일관성 + CTR 개선",
    result: "CTR 4.2% → 8.7%, 평균 노출 1.4× 증가. 시리즈 단위 운영 정착.",
    duration: "12h · 8종",
    channels: ["YouTube", "Shorts"],
    process: [
      "채널 분석 + 경쟁 채널 CTR 패턴 분석",
      "AI가 시리즈 8종 비주얼 시안 생성",
      "디렉터 P · CTR 후킹 요소만 남기고 정제",
      "발행 후 CTR 기반 시리즈 수정",
    ],
    aiPipeline: ["Hook headline", "Color contrast", "16:9 layout"],
    before: { label: "기존 썸네일", note: "톤 비통일 · CTR 4.2%" },
    after: { label: "BODA 시리즈", note: "톤 통합 · CTR 8.7%" },
  },
  "PF·05": {
    goal: "D2C 리빙 브랜드의 비주얼 시스템 정리 · 운영 가이드까지",
    result:
      "로고 · 컬러 · 타이포 시스템 + 48p 운영 가이드 완성. 시즌 콘텐츠 운영도 안정화.",
    duration: "5d · 48p 가이드",
    channels: ["Identity", "Guideline"],
    process: [
      "브랜드 인터뷰 · 톤 키워드 4개 정의",
      "AI 로고 시안 18종 · 컬러 팔레트 6종 생성",
      "디렉터 Y · 최종 3안 정제 + 시스템화",
      "48p 운영 가이드 + 템플릿 패키지 납품",
    ],
    aiPipeline: ["Logo variants", "Palette pairing", "Type pairing"],
    before: { label: "이전 아이덴티티", note: "시각 언어 비통일 · 채널별 따로 운영" },
    after: { label: "BODA 시스템", note: "전 채널 통합 시스템 · 운영 가이드 48p" },
  },
  "PF·06": {
    goal: "단일 SKU 매출 확장 · 스마트스토어 + 쿠팡 통합 운영",
    result: "ROAS 2.4 → 4.1, 모바일 전환 흐름 재설계로 이탈률 32% 감소.",
    duration: "18h · 모바일 우선",
    channels: ["Smartstore", "Coupang"],
    process: [
      "기존 페이지 진단 · 이탈 구간 분석",
      "AI 후킹 카피 + 비주얼 변형 생성",
      "디렉터 J · 모바일 전환 흐름 재설계",
      "라이브 후 일주일 ROAS 추적",
    ],
    aiPipeline: ["Copy v4.2", "Mobile flow", "CTA optimize"],
    before: { label: "기존 페이지", note: "ROAS 2.4 · 이탈률 71%" },
    after: { label: "BODA 리뉴얼", note: "ROAS 4.1 · 이탈률 48%" },
  },
};

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
    { key: "deck", label: "회사소개서", base: 149000 },
    { key: "shorts", label: "쇼츠·릴스", base: 79000 },
    { key: "renewal", label: "콘텐츠 리뉴얼", base: 59000 },
    { key: "brand-pkg", label: "브랜드 패키지", base: 280000 },
    { key: "subscription", label: "정기 구독 (월)", base: 390000 },
  ],
  delivery: [
    { key: "normal", label: "보통 (3-5일)", multiplier: 1 },
    { key: "fast", label: "빠른 납품 (1-2일)", multiplier: 1.3 },
    { key: "easy", label: "여유 (7일 이상)", multiplier: 0.9 },
  ],
  addons: [
    { key: "english", label: "영문 버전", price: 30000 },
    { key: "revision", label: "추가 수정 1회", price: 20000 },
    { key: "multi", label: "멀티포맷 변환", price: 50000 },
    { key: "guide", label: "브랜드 가이드", price: 40000 },
    { key: "cover", label: "SNS 커버 이미지", price: 15000 },
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

export type Review = {
  initials: string;
  role: string;
  industry: string;
  scale: string;
  badge: string;
  body: string;
  rating: string;
  timestamp: string;
  verified?: boolean;
  repeat?: number;
};

export const reviews: readonly Review[] = [
  {
    initials: "박*연",
    role: "뷰티 브랜드 대표",
    industry: "Beauty · D2C",
    scale: "월 매출 4억+",
    badge: "상세페이지",
    body: "AI가 초안을 이렇게 빠르게 잡아줄 줄 몰랐어요. 디렉터 분이 마무리해 주시니 브랜드 톤도 살아 있고, 무엇보다 CTR이 눈에 띄게 올랐어요. 두 번째 시즌도 BODA로 진행 중입니다.",
    rating: "5.0",
    timestamp: "2주 전",
    verified: true,
    repeat: 3,
  },
  {
    initials: "이*훈",
    role: "스마트스토어 셀러",
    industry: "F&B · Health",
    scale: "월 매출 8천만+",
    badge: "광고 배너",
    body: "A/B 12종을 24시간 만에 받았어요. 사이즈만 다른 게 아니라 카피와 후킹 방식이 전부 달라서, CPA가 30% 가까이 줄었습니다.",
    rating: "5.0",
    timestamp: "한 달 전",
    verified: true,
    repeat: 2,
  },
  {
    initials: "정*아",
    role: "라이프스타일 스타트업 CMO",
    industry: "Lifestyle",
    scale: "Series A",
    badge: "브랜드 디자인",
    body: "에이전시 견적의 1/3로 풀 브랜드 시스템을 받았는데, 결과물은 오히려 더 정돈되어 있어요. 운영 가이드 48p까지 받아서 바로 적용했고, 신규 채널 런칭까지 같은 톤으로 끌고 갈 수 있게 됐어요.",
    rating: "5.0",
    timestamp: "지난주",
    verified: true,
  },
  {
    initials: "K Studio",
    role: "광고대행사 디렉터",
    industry: "Agency Partner",
    scale: "에이전시 화이트라벨",
    badge: "Agency",
    body: "내부 디자이너 한 명이 더 생긴 느낌입니다. 클라이언트 일정에 맞춰 빠르게 시안이 나와서, 우리 팀은 디렉팅에만 집중할 수 있어요.",
    rating: "5.0",
    timestamp: "지난주",
    verified: true,
    repeat: 6,
  },
  {
    initials: "최*우",
    role: "F&B 브랜드 운영팀",
    industry: "F&B",
    scale: "월 매출 1.2억+",
    badge: "SNS 시리즈",
    body: "운영하면서 저장률이 이렇게 빨리 오른 건 처음입니다. 톤은 우리 브랜드가 맞는데, 더 정돈된 버전이라는 느낌이에요.",
    rating: "4.9",
    timestamp: "3주 전",
    verified: true,
  },
];

export const contactInfo = {
  responseTime: "평균 24시간 이내 회신",
  workHours: "KST 10:00 – 19:00 · 월–금",
  newProjectStatus: "신규 프로젝트 접수 중",
  nda: "사전 NDA 가능",
  steps: [
    { label: "문의 접수", desc: "메일 또는 폼" },
    { label: "스코프 정리", desc: "30분 비대면 미팅" },
    { label: "견적 회신", desc: "24h 이내" },
    { label: "킥오프", desc: "브리프 + 일정 확정" },
  ],
};

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
