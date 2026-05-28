# STUDIO BODA — Official Site

> AI와 전문가가 함께 완성하는 콘텐츠 제작 스튜디오 · See it. Make it. Ship it tomorrow.

BODA Design System v1.0 사양에 따라 제작된 STUDIO BODA의 공식 웹사이트입니다.
"AI 기반 광고 제작 스튜디오 + SaaS 플랫폼" 무드를 동시에 표현하는 프로덕션 레디 랜딩 페이지입니다.

## Stack

- **Next.js 14** (App Router) + **React 18**
- **TypeScript** strict · no `any`
- **TailwindCSS 3** + 디자인 토큰 확장 (Iris / Ink scale / 8pt spacing)
- **Framer Motion** — scroll reveal · subtle micro-interactions (남용 X)
- **Plus Jakarta Sans** (Display) + **Noto Sans KR** (Body)
- **Tabler Icons** (Outline)
- 반응형 모바일 우선 · SEO 메타데이터 · JSON-LD · 접근성

## Getting Started

```bash
npm install
npm run dev          # http://localhost:3000
```

## Scripts

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 검사 |

## Page Sections

배경 컬러는 `white ↔ ink-5 ↔ ink-100 ↔ iris` 로 교차하여 자연스러운 시각적 리듬을 형성합니다.

| 순번 | 섹션 | 컴포넌트 | 배경 |
| --- | --- | --- | --- |
| 01 | Navbar (sticky, blur) | `Header` | transparent → white/80 |
| 02 | Hero + AI 대시보드 | `Hero` | `ink-100` |
| 03 | Services (탭 + 카드) | `Services` | white |
| 04 | How It Works (4-step) | `HowItWorks` | `ink-5` |
| 05 | AI Engine + Chat Demo | `AIFeature` | white |
| 06 | 실시간 견적 계산기 | `QuoteCalculator` | `ink-5` |
| 07 | Portfolio (mock 6종) | `Portfolio` | white |
| 08 | Dashboard Preview | `DashboardPreview` | white |
| 09 | Trust · Stats · Reviews | `Trust` | `ink-5` |
| 10 | Pricing (3 플랜) | `Pricing` | white |
| 11 | FAQ (Accordion) | `FAQ` | `ink-5` |
| 12 | Final CTA | `CTASection` | `iris` |
| 13 | Footer | `Footer` | `ink-100` |
| sticky | Mobile CTA | `MobileCTA` | `iris` |

## Project Structure

```
app/
  layout.tsx                  # 폰트 · 메타데이터 · 파비콘
  page.tsx                    # 섹션 조립
  globals.css                 # 폰트 · 토큰 · 유틸리티
components/
  Header.tsx                  # Sticky Navbar
  Hero.tsx                    # 다크 Hero + 미니 Dashboard
  Logo.tsx                    # LogoSymbol / Logo lockup
  Services.tsx                # 탭 + 카드 (default / featured)
  HowItWorks.tsx              # 4-step Flow
  AIFeature.tsx               # AI 기능 + Chat Demo (animated)
  QuoteCalculator.tsx         # State 기반 실시간 견적
  Portfolio.tsx               # Mock case 6 + 카테고리별 visual
  DashboardPreview.tsx        # 사이드바 + 주문 리스트
  Trust.tsx                   # Stats + Reviews
  Pricing.tsx                 # default + popular(dark)
  FAQ.tsx                     # Accordion
  CTASection.tsx              # Iris bg CTA
  Footer.tsx                  # Ink 100 footer
  MobileCTA.tsx               # Sticky mobile button
  SectionHeader.tsx           # 섹션 공통 헤더
  ui/
    Button.tsx                # Button / LinkButton (7 variants)
    Card.tsx                  # Card (light/soft/dark)
    Reveal.tsx                # Reduced-motion safe reveal
lib/
  site-data.ts                # 모든 카피·서비스·포트폴리오·플랜·FAQ·리뷰
```

## Design System (BODA v1.0)

### Color

| Token | HEX |
| --- | --- |
| `iris` (Primary) | `#5847FF` |
| `iris-light` | `#EEEDFF` |
| `sky` | `#7C9CFF` |
| `plum` | `#8A6CFF` |
| `ink-100` | `#0A0A12` |
| `ink-90` | `#181826` |
| `ink-70` | `#494956` |
| `ink-50` | `#7E7E8C` |
| `ink-30` | `#C6C7D0` |
| `ink-15` | `#E6E6EC` |
| `ink-5` | `#F6F6FA` |
| `success` | `#4ADE80` |
| `warning` | `#F59E0B` |

### Typography

- Display · Title: **Plus Jakarta Sans** 800 / 700
- Body · UI: **Noto Sans KR** 400 / 500
- Tokens: `text-display` (52px/800), `text-h1` (32px/800), `text-h2` (24px/700), `text-h3` (18px/700)

### Depth Philosophy

- **NO box-shadow** — depth는 border + background color로만 표현
- 호버 lift는 최대 `-translate-y-0.5` (-2px)
- 호버 색상 변화는 border 또는 opacity 중심

### Spacing

8pt 기반. Tailwind 기본 + custom (`4.5` 18px, `9.5` 38px, `13` 52px, `18` 72px)

### Radius

`rounded-lg` 8 · `rounded-xl` 12 · `rounded-2xl` 16 · `rounded-[20px]` 20 · `rounded-full` 999

## SEO & Accessibility

- `metadata` + `viewport` + Organization JSON-LD
- 시맨틱 HTML (`section`, `nav`, `article`, `ol`, `aside`, `footer`)
- `prefers-reduced-motion` 존중 — `Reveal` 컴포넌트가 모션 비활성화
- 키보드 포커스: `focus-ring` 유틸리티 적용
- 모든 인터랙티브 요소 `aria-*` 속성

## Extending

- 카피·데이터는 모두 `lib/site-data.ts`에서 단일 소스
- 포트폴리오에 실제 이미지가 들어올 때:
  - `lib/site-data.ts`의 `portfolio` 객체에 `image: string` 필드 추가
  - `components/Portfolio.tsx`의 `PortfolioThumb`에서 `next/image`로 교체
- 로고는 `components/Logo.tsx`의 `LogoSymbol` SVG만 교체하면 사이트 전체 반영

## License

© 2026 Studio BODA. All rights reserved.
