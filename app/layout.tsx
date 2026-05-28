import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://studioboda.kr"),
  title: {
    default: "STUDIO BODA — See it. Make it. Ship it tomorrow.",
    template: "%s | STUDIO BODA",
  },
  description:
    "STUDIO BODA는 AI 기반 크리에이티브 스튜디오입니다. 상세페이지, 광고 배너, SNS 콘텐츠, 썸네일, 브랜드 디자인을 24시간 안에 완성합니다.",
  keywords: [
    "STUDIO BODA",
    "스튜디오 보다",
    "AI 크리에이티브",
    "상세페이지 제작",
    "광고 배너 제작",
    "SNS 콘텐츠",
    "썸네일 제작",
    "브랜드 디자인",
    "스마트스토어 디자인",
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
    title: "STUDIO BODA — See it. Make it. Ship it tomorrow.",
    description:
      "AI로 상세페이지, 광고, 콘텐츠를 24시간 안에 완성하는 프리미엄 크리에이티브 스튜디오.",
  },
  twitter: {
    card: "summary_large_image",
    title: "STUDIO BODA — See it. Make it. Ship it tomorrow.",
    description:
      "AI로 상세페이지, 광고, 콘텐츠를 24시간 안에 완성하는 프리미엄 크리에이티브 스튜디오.",
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
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a12" },
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
