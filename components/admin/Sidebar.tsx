"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "ti-layout-dashboard" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "ti-mail" },
  { href: "/admin/quotes", label: "Quotes", icon: "ti-file-invoice" },
  { href: "/admin/payments", label: "Payments", icon: "ti-credit-card" },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: "ti-repeat" },
  { href: "/admin/projects", label: "Projects", icon: "ti-folders" },
  { href: "/admin/portfolio", label: "Portfolio", icon: "ti-photo" },
  { href: "/admin/members", label: "Members", icon: "ti-users" },
  { href: "/admin/settings", label: "Settings", icon: "ti-settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex lg:w-[232px] lg:shrink-0 lg:flex-col lg:border-r lg:border-ink-90 lg:bg-ink-100">
      <div className="flex h-[60px] items-center gap-2.5 border-b border-ink-90 px-5">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-iris">
          <span className="font-display text-[11px] font-bold text-white">B</span>
        </span>
        <span className="font-display text-[14px] font-bold text-white">
          STUDIO BODA <span className="text-ink-30">Admin</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((n) => {
          const active =
            n.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ${
                active
                  ? "bg-iris/15 text-white"
                  : "text-ink-30 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <i
                className={`ti ${n.icon} text-[16px] ${active ? "text-iris-glow" : "text-ink-50 group-hover:text-ink-30"}`}
                aria-hidden
              />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ink-90 p-4 text-[11px] text-ink-50">
        Studio OS · v1.0
      </div>
    </aside>
  );
}
