import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://studioboda.kr"),
  title: {
    default: "STUDIO BODA — AI와 전문가가 함께 완성하는 콘텐츠 제작 스튜디오",
    template: "%s | STUDIO BODA",
  },
  description:
    "상세페이지, 광고 배너, SNS 콘텐츠, 유튜브 썸네일, 브랜드 디자인까지. AI가 초안을 잡고 디렉터가 완성하는 프리미엄 크리에이티브 스튜디오.",
  keywords: [
    "STUDIO BODA",
    "스튜디오 보다",
    "AI 콘텐츠 제작",
    "AI 크리에이티브",
    "상세페이지 제작",
    "광고 배너 제작",
    "SNS 콘텐츠 제작",
    "썸네일 제작",
    "브랜드 디자인",
    "스마트스토어",
    "퍼포먼스 마케팅",
  ],
  authors: [{ name: "STUDIO BODA" }],
  creator: "STUDIO BODA",
  publisher: "STUDIO BODA",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://studioboda.kr",
    siteName: "STUDIO BODA",
    title: "STUDIO BODA — AI와 전문가가 함께 완성하는 콘텐츠 제작",
    description:
      "상세페이지, 광고, SNS, 썸네일, 브랜드 디자인. AI 초안 + 디렉터 완성.",
  },
  twitter: {
    card: "summary_large_image",
    title: "STUDIO BODA — AI와 전문가가 함께 완성하는 콘텐츠 제작",
    description:
      "상세페이지, 광고, SNS, 썸네일, 브랜드 디자인. AI 초안 + 디렉터 완성.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://studioboda.kr",
  },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 34'%3E%3Ccircle cx='17' cy='17' r='14.5' fill='none' stroke='%235B47FF' stroke-width='3'/%3E%3Crect x='15.5' y='1.5' width='3' height='5' rx='1.5' fill='%235B47FF'/%3E%3Ccircle cx='17' cy='17' r='8' fill='%235B47FF'/%3E%3Ccircle cx='17' cy='17' r='3.2' fill='%23ffffff'/%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A12" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-ink-100 antialiased">
        {children}
      </body>
    </html>
  );
}
