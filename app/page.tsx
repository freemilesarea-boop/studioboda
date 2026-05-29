import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ClientLogos } from "@/components/ClientLogos";
import { Services } from "@/components/Services";
import { HowItWorks } from "@/components/HowItWorks";
import { AIFeature } from "@/components/AIFeature";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { Portfolio } from "@/components/Portfolio";
import { Trust } from "@/components/Trust";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "STUDIO BODA",
  alternateName: "스튜디오 보다",
  url: "https://studioboda.kr",
  email: "hello@studioboda.kr",
  description:
    "AI가 초안을 잡고 디렉터가 완성합니다. 상세페이지, 광고, SNS, 썸네일, 브랜드 디자인까지.",
  slogan: "See it. Make it. Ship it tomorrow.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Seoul",
    addressCountry: "KR",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main id="top">
        <Hero />
        <Services />
        <HowItWorks />
        <Portfolio />
        <AIFeature />
        <Pricing />
        <QuoteCalculator />
        <Trust />
        <ClientLogos />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}
