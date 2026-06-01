import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Portfolio } from "@/components/Portfolio";
import { Pricing } from "@/components/Pricing";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";
import { HomeNotificationBanner } from "@/components/HomeNotificationBanner";

// Per-user progress banner is rendered for logged-in customers, so the page
// must render dynamically rather than be served from the ISR cache.
export const dynamic = "force-dynamic";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "STUDIO BODA",
  alternateName: "스튜디오 보다",
  url: "https://studioboda.kr",
  email: "contact@swk.today",
  description:
    "AI가 초안을 잡고 디렉터가 완성합니다. 상세페이지, 광고, SNS, 썸네일, 브랜드 디자인까지.",
  slogan: "See it. Make it. Ship it tomorrow.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Seoul",
    addressCountry: "KR",
  },
};

export default async function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <HomeNotificationBanner />
      <main id="top">
        <Hero />
        <HowItWorks />
        <Portfolio />
        <Pricing />
        <CTASection />
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}
