"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/me", label: "대시보드", icon: "ti-layout-dashboard", match: /^\/me$/ },
  { href: "/me/inquiries", label: "문의", icon: "ti-mail", match: /^\/me\/inquiries/ },
  { href: "/me/quotes", label: "견적", icon: "ti-file-invoice", match: /^\/me\/quotes/ },
  { href: "/me/projects", label: "프로젝트", icon: "ti-folders", match: /^\/me\/projects/ },
];

export function MeNav() {
  const pathname = usePathname() ?? "/me";
  return (
    <nav className="mx-auto hidden max-w-[1100px] gap-1 border-t border-ink-15 px-3 lg:flex lg:px-6">
      {NAV.map((n) => {
        const active = n.match.test(pathname);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-3 font-display text-[12.5px] font-bold transition-colors ${
              active
                ? "border-iris text-iris"
                : "border-transparent text-ink-50 hover:text-ink-100"
            }`}
          >
            <i className={`ti ${n.icon} text-[14px]`} aria-hidden />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MeMobileNav() {
  const pathname = usePathname() ?? "/me";
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-ink-15 bg-white lg:hidden">
      {NAV.map((n) => {
        const active = n.match.test(pathname);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold ${
              active ? "text-iris" : "text-ink-50"
            }`}
          >
            <i className={`ti ${n.icon} text-[18px]`} aria-hidden />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
