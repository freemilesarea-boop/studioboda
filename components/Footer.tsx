import Link from "next/link";
import { Logo } from "./Logo";
import { brand, nav } from "@/lib/site-data";

export function Footer() {
  return (
    <footer className="border-t border-ink-15 bg-white">
      <div className="container py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo variant="stacked" size={28} />
            <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-ink-70">
              {brand.mainMessage} {brand.description}
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="meta">SITEMAP</div>
            <ul className="mt-5 space-y-2.5">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="text-[15px] text-ink-70 transition-colors hover:text-ink-100"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="#contact"
                  className="text-[15px] text-ink-70 transition-colors hover:text-ink-100"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="meta">CONTACT</div>
            <ul className="mt-5 space-y-2.5 text-[15px] text-ink-70">
              <li>
                <a
                  href={`mailto:${brand.email}`}
                  className="font-mono transition-colors hover:text-ink-100"
                >
                  {brand.email}
                </a>
              </li>
              <li>{brand.location}</li>
              <li className="meta pt-2">AI · CREATIVE · STUDIO</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-ink-15 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-50">
            © 2026 STUDIO BODA. All rights reserved.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-meta text-ink-50">
            BUILT IN SEOUL · SHIPPED TOMORROW
          </p>
        </div>
      </div>
    </footer>
  );
}
