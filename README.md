# STUDIO BODA — Official Site

> See it. Make it. Ship it tomorrow.

STUDIO BODA의 공식 웹사이트입니다. AI 기반 크리에이티브 스튜디오의 브랜드 톤을 그대로 반영한 미니멀 프리미엄 랜딩 페이지로 구성되어 있습니다.

## Stack

- **Next.js 14** (App Router) + **React 18**
- **TypeScript** (strict)
- **TailwindCSS 3** + Pretendard / JetBrains Mono
- **Framer Motion** (scroll reveal, micro-interactions)
- 반응형 모바일 우선 · SEO 메타데이터 · JSON-LD

## Getting Started

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

## Available Scripts

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (`http://localhost:3000`) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과물 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 |

## Project Structure

```
app/
  layout.tsx          # 루트 레이아웃 · 폰트 · 메타데이터
  page.tsx            # 메인 랜딩 페이지
  globals.css         # 글로벌 스타일 · 디자인 토큰
components/
  Header.tsx          # 글로벌 헤더 (스크롤 반응)
  Hero.tsx            # 히어로 + AI 대시보드 카드
  Logo.tsx            # 렌즈/조리개 모티브 심볼 (SVG)
  BrandKeywords.tsx   # 5가지 브랜드 키워드 카드
  ServiceLineup.tsx   # 서비스 라인업 카드
  Process.tsx         # 5단계 제작 프로세스
  Portfolio.tsx       # 포트폴리오 mock 카드
  Packages.tsx        # 패키지(견적 문의형) 카드
  FAQ.tsx             # 아코디언 FAQ
  FinalCTA.tsx        # 다크 CTA 섹션
  Footer.tsx          # 푸터
  MobileCTA.tsx       # 모바일 sticky 문의 버튼
  SectionHeader.tsx   # 섹션 헤더 공통
  ui/
    Button.tsx        # Button · LinkButton · ArrowIcon
    Card.tsx          # Card · CardLabel
    Reveal.tsx        # scroll reveal wrapper
lib/
  site-data.ts        # 모든 카피/데이터 (포트폴리오·패키지·FAQ 등)
```

## Brand System (요약)

- **Slogan**: See it. Make it. Ship it tomorrow.
- **Main Message**: 당신의 브랜드를 한 번 더 보다.
- **Core Values**: Velocity · Aesthetic · Performance

| Token | HEX |
| --- | --- |
| Iris Pulse (Primary) | `#5B47FF` |
| Sky Drift | `#7C9CFF` |
| Plum Halo | `#8A6CFF` |
| Ink 100 | `#0A0A12` |
| Ink 90 | `#1B1B26` |
| Ink 70 | `#494956` |
| Ink 50 | `#7E7E8C` |
| Ink 30 | `#C7C7D0` |
| Ink 15 | `#E6E6EC` |
| Ink 05 | `#F6F6FA` |
| White | `#FFFFFF` |

- Typography: **Pretendard Variable** (본문/헤드라인), **JetBrains Mono** (캡션/메타)

## Extending the Site

- 포트폴리오/패키지/서비스/FAQ 카피는 모두 `lib/site-data.ts`에서 관리합니다.
- 추후 실제 포트폴리오 이미지로 교체할 때는 `components/Portfolio.tsx`의 `Visual` mock을 `<Image src={item.image} ... />`로 바꾸기만 하면 됩니다 (`portfolio[].image` 필드를 데이터에 추가).
- 로고 교체 시 `components/Logo.tsx`의 `LogoMark` SVG만 다른 컴포넌트/이미지로 대체하면 됩니다.

## Notes

- 다크모드 자체 토글은 포함하지 않지만, 헤드라인/CTA에서 Ink 100 다크 영역을 사용해 시각적 리듬을 줍니다.
- 메인 컬러(Iris Pulse)는 CTA와 포인트 인터랙션에만 사용하여 전체 면적의 5% 이하로 절제했습니다.
- 모든 섹션은 `Reveal` 컴포넌트를 통해 자연스러운 scroll reveal 애니메이션을 적용합니다 (`prefers-reduced-motion` 존중).

## License

© 2026 STUDIO BODA. All rights reserved.
