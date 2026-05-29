"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoSymbol } from "./Logo";
import { nav } from "@/lib/site-data";
import { AuthMenu, AuthMenuMobile } from "./AuthMenu";
import { StartCTA } from "./StartCTA";

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
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background,backdrop-filter,border-color] duration-300 ${
        scrolled
          ? "border-ink-15 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70"
          : "border-ink-15/70 bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div
        className={`flex w-full items-center justify-between px-5 transition-[height] duration-300 sm:px-8 lg:px-12 ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
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

        <div className="hidden items-center gap-3 md:flex">
          <AuthMenu />
          <span className="hidden h-5 w-px bg-ink-15 md:inline-block" />
          <StartCTA size="md">프로젝트 문의하기</StartCTA>
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
            <AuthMenuMobile onNavigate={() => setOpen(false)} />
            <div className="mt-3">
              <StartCTA
                size="lg"
                className="w-full"
                onNavigate={() => setOpen(false)}
              >
                프로젝트 문의하기
              </StartCTA>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
