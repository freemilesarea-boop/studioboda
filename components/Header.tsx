"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { LinkButton } from "./ui/Button";
import { nav } from "@/lib/site-data";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,backdrop-filter,border-color] duration-300 ${
        scrolled
          ? "border-b border-ink-15 bg-white/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="STUDIO BODA — Home" className="shrink-0">
          <Logo size={20} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm text-ink-70 transition-colors hover:bg-ink-05 hover:text-ink-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <LinkButton href="#contact" size="sm">
            프로젝트 문의
          </LinkButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴 열기"
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-15 bg-white text-ink-100 md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            {open ? (
              <path
                d="M3 3l10 10M13 3 3 13"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M2 5h12M2 11h12"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden">
          <div className="container border-t border-ink-15 bg-white py-4">
            <nav className="flex flex-col">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-3 py-3 text-base text-ink-90 hover:bg-ink-05"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3">
              <LinkButton
                href="#contact"
                size="md"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                프로젝트 문의하기
              </LinkButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
