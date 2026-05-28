import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BrandKeywords } from "@/components/BrandKeywords";
import { ServiceLineup } from "@/components/ServiceLineup";
import { Process } from "@/components/Process";
import { Portfolio } from "@/components/Portfolio";
import { Packages } from "@/components/Packages";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
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
    "AI로 상세페이지, 광고, 콘텐츠를 24시간 안에 완성하는 프리미엄 크리에이티브 스튜디오.",
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
        <BrandKeywords />
        <ServiceLineup />
        <Process />
        <Portfolio />
        <Packages />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}
