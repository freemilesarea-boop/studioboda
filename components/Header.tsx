"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoSymbol } from "./Logo";
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
      className={`fixed inset-x-0 top-0 z-50 transition-[background,backdrop-filter,border-color] duration-200 ${
        scrolled
          ? "border-b border-ink-15 bg-white/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="flex h-16 w-full items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="STUDIO BODA — Home" className="flex items-center gap-2.5">
          <LogoSymbol size={28} />
          <span className="text-[17px] font-extrabold tracking-tight text-ink-100">
            BODA
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-1.5 text-[13px] font-medium text-ink-70 transition-colors hover:bg-ink-5 hover:text-ink-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="#dashboard"
            className="rounded-lg border border-ink-15 px-4 py-2 text-[13px] font-medium text-ink-70 transition-colors hover:border-ink-30 hover:text-ink-100"
          >
            대시보드
          </Link>
          <LinkButton href="#quote" size="md">
            무료로 시작하기
          </LinkButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-lg border border-ink-15 bg-white text-ink-100 md:hidden"
        >
          <i
            className={`ti ${open ? "ti-x" : "ti-menu-2"} text-[18px]`}
            aria-hidden
          />
        </button>
      </div>

      {open && (
        <div className="md:hidden">
          <div className="border-t border-ink-15 bg-white px-5 py-4">
            <nav className="flex flex-col">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-[15px] font-medium text-ink-90 hover:bg-ink-5"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 grid gap-2">
              <Link
                href="#dashboard"
                onClick={() => setOpen(false)}
                className="grid h-11 place-items-center rounded-lg border border-ink-15 text-[14px] font-medium text-ink-70"
              >
                대시보드
              </Link>
              <LinkButton
                href="#quote"
                size="lg"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                무료로 시작하기
              </LinkButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
