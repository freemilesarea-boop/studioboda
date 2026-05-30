import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";
import { listFaqCategories, listFaqItems } from "@/lib/queries/faq";
import { FaqBrowser } from "./FaqBrowser";

export const metadata: Metadata = {
  title: "자주 묻는 질문 · STUDIO BODA",
  description:
    "STUDIO BODA 이용에 대해 자주 묻는 질문을 모았습니다. 서비스, 결제, 진행 과정 등 궁금한 점을 빠르게 확인하세요.",
  openGraph: {
    title: "자주 묻는 질문 · STUDIO BODA",
    description:
      "STUDIO BODA 이용에 대해 자주 묻는 질문을 모았습니다. 궁금한 점을 빠르게 확인하세요.",
    type: "website",
  },
};

export const revalidate = 60;

export default async function FaqPage() {
  const [categories, items] = await Promise.all([
    listFaqCategories(),
    listFaqItems(),
  ]);

  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pb-16 lg:pt-12">
          <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
            FAQ
          </p>
          <h1 className="mt-3 max-w-[820px] font-display text-[38px] font-extrabold leading-[1.1] tracking-display text-ink-100 sm:text-[44px] lg:text-[52px]">
            자주 묻는 질문
          </h1>
          <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-ink-50">
            STUDIO BODA 이용에 대해 자주 묻는 질문을 모았습니다. 검색하거나
            카테고리를 선택해 빠르게 찾아보세요.
          </p>
          <div className="mt-10">
            <FaqBrowser categories={categories} items={items} />
          </div>
        </section>
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}
