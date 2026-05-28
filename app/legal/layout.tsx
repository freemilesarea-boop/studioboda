import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="pt-24">
        <article className="mx-auto max-w-[760px] px-5 pb-20 pt-8 sm:px-8 lg:px-0 lg:pb-24 lg:pt-12">
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
