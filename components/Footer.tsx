import Link from "next/link";
import { LogoSymbol } from "./Logo";
import { brand, footerLinks, footerMeta } from "@/lib/site-data";

export function Footer() {
  return (
    <footer className="bg-ink-100 px-5 pb-7 pt-13 sm:px-8 lg:px-12">
      <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 sm:col-span-4 lg:col-span-1">
          <Link
            href="/#top"
            aria-label="STUDIO BODA — 최상단으로"
            className="mb-3.5 inline-flex items-center gap-2 rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <LogoSymbol size={28} />
            <span className="font-display text-[17px] font-extrabold text-white">
              BODA
            </span>
          </Link>
          <p className="max-w-[280px] text-[12px] leading-[1.75] text-ink-50">
            AI와 전문가가 함께 만드는 콘텐츠 제작 스튜디오. {brand.location}에서
            전 세계 브랜드와 일합니다.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink-90 bg-ink-90/60 px-3 py-1.5">
            <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center text-success live-ring">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30">
              {footerMeta.status}
            </span>
          </div>
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
                    className="group inline-flex items-center gap-1.5 text-[12px] text-ink-50 transition-colors hover:text-ink-30"
                  >
                    <span>{it.label}</span>
                    <span className="opacity-0 transition-opacity duration-150 group-hover:opacity-60">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 border-y border-ink-90 py-6 sm:grid-cols-4">
        <FooterStat label="누적 프로젝트" value="2,400" suffix="+" />
        <FooterStat label="평균 1차 납기" value="24" suffix="h" />
        <FooterStat label="고객 만족도" value="98" suffix="%" />
        <FooterStat label="활성 브랜드" value="320" suffix="+" />
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1 text-[11px] text-ink-50">
          <p>{brand.copyright}</p>
          <p className="num font-mono text-[10px]">
            {footerMeta.hq}
            {footerMeta.business ? ` · ${footerMeta.business}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FooterBadge>SSL 보안</FooterBadge>
          <FooterBadge>개인정보 보호</FooterBadge>
          <FooterBadge>NDA 가능</FooterBadge>
          <FooterBadge>전자세금계산서</FooterBadge>
        </div>
      </div>
    </footer>
  );
}

function FooterStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div>
      <p className="num font-display text-[24px] font-extrabold leading-none tracking-[-0.5px] text-white sm:text-[28px]">
        {value}
        <span className="text-iris">{suffix}</span>
      </p>
      <p className="mt-1.5 text-[11px] text-ink-50">{label}</p>
    </div>
  );
}

function FooterBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-ink-90 px-2.5 py-0.5 text-[10px] text-ink-70 transition-colors hover:border-ink-70 hover:text-ink-30">
      {children}
    </span>
  );
}
