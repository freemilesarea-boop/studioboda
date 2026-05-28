"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "대시보드", icon: "ti-layout-dashboard" },
  { href: "/admin/inquiries", label: "문의", icon: "ti-mail" },
  { href: "/admin/quotes", label: "견적", icon: "ti-file-invoice" },
  { href: "/admin/payments", label: "결제", icon: "ti-credit-card" },
  { href: "/admin/projects", label: "프로젝트", icon: "ti-folders" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-ink-15 bg-white lg:hidden">
      {NAV.map((n) => {
        const active =
          n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${
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
