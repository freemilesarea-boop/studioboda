import Link from "next/link";
import { LogoSymbol } from "./Logo";
import { brand, footerLinks } from "@/lib/site-data";

export function Footer() {
  return (
    <footer className="bg-ink-100 px-5 pb-7 pt-13 sm:px-8 lg:px-12">
      <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-[2.2fr_1fr_1fr_1fr]">
        <div className="col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="mb-3.5 flex items-center gap-2">
            <LogoSymbol size={28} />
            <span className="font-display text-[17px] font-extrabold text-white">
              BODA
            </span>
          </div>
          <p className="max-w-[260px] text-[12px] leading-[1.75] text-ink-50">
            AI와 전문가가 함께 만드는 콘텐츠 제작 스튜디오. {brand.location}에서
            전 세계 브랜드와 일합니다.
          </p>
        </div>

        {footerLinks.map((col) => (
          <div key={col.title}>
            <p className="mb-3.5 font-display text-[11px] font-bold uppercase tracking-eyebrow text-ink-30">
              {col.title}
            </p>
            <ul className="space-y-2">
              {col.items.map((it) => (
                <li key={it.label}>
                  <Link
                    href={it.href}
                    className="block text-[12px] text-ink-50 transition-colors hover:text-ink-30"
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-ink-90 pt-5 sm:flex-row sm:items-center">
        <p className="text-[11px] text-ink-70">{brand.copyright}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-ink-90 px-2.5 py-0.5 text-[10px] text-ink-70">
            SSL 보안
          </span>
          <span className="rounded-full border border-ink-90 px-2.5 py-0.5 text-[10px] text-ink-70">
            개인정보 보호
          </span>
          <span className="rounded-full border border-ink-90 px-2.5 py-0.5 text-[10px] text-ink-70">
            전자세금계산서
          </span>
        </div>
      </div>
    </footer>
  );
}
