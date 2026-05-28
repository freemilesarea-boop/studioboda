"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowGlyph, LinkButton } from "./ui/Button";
import { StartCTA } from "./StartCTA";
import { heroStats, dashboardJobs, heroQueue, type DashboardJob } from "@/lib/site-data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const HERO_WORDMARKS = [
  "SRR.KR",
  "LOUVER",
  "MAGAZINE 230",
  "DEUDDA",
  "SWK TODAY",
];

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="hero-stage relative overflow-hidden px-5 pb-0 pt-24 sm:px-8 sm:pt-28 lg:px-12 lg:pt-32">
      <div className="hero-beam" aria-hidden />
      <div className="hero-bloom" aria-hidden />

      <div className="relative grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6 lg:pt-4">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-sm"
          >
            <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center text-electric live-ring">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-electric" />
            </span>
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-electric-soft">
              AI Creative Operating System
            </span>
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
            className="mt-7 max-w-[640px] font-display text-[40px] font-extrabold leading-[1.06] tracking-[-1.6px] text-white sm:text-[48px] lg:text-[58px] xl:text-[64px]"
          >
            AI는 초안을 만들고,
            <br />
            <span className="bg-iris-text bg-clip-text text-transparent [-webkit-background-clip:text]">
              디렉터
            </span>
            가{" "}
            <span className="text-white">브랜드</span>를
            <br />
            완성합니다.
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.14, ease: EASE }}
            className="mt-6 max-w-[520px] text-[15px] leading-[1.75] text-ink-30 sm:text-[16px]"
          >
            상세페이지 · 광고 · SNS · 썸네일 · 브랜드 디자인까지. AI 제작 파이프라인 위에 디렉터 큐레이션을 얹어, 24시간 안에 운영 가능한 자산을 만듭니다.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <StartCTA size="lg" variant="cinematic">
              무료 견적 받기 <ArrowGlyph />
            </StartCTA>
            <LinkButton href="#portfolio" size="lg" variant="ghost-cinematic">
              포트폴리오 보기
            </LinkButton>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={reduce ? undefined : { opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="mt-10"
          >
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-50">
              Trusted by · Brand Group
            </p>
            <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-7">
              {HERO_WORDMARKS.map((name) => (
                <li key={name}>
                  <span className="font-display text-[12.5px] font-extrabold uppercase tracking-[0.16em] text-white/45 transition-colors duration-200 hover:text-white/85 sm:text-[13.5px]">
                    {name}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="lg:col-span-6">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          >
            <HeroWorkspace />
          </motion.div>
        </div>
      </div>

      <div className="relative mt-16 grid grid-cols-2 border-t border-white/[0.08] sm:mt-20 lg:mt-16 lg:grid-cols-4">
        {heroStats.map((s, i) => (
          <HeroStat key={s.label} stat={s} divider={i < heroStats.length - 1} index={i} />
        ))}
      </div>
    </section>
  );
}

function HeroStat({
  stat,
  divider,
  index,
}: {
  stat: (typeof heroStats)[number];
  divider: boolean;
  index: number;
}) {
  // Rotate accents: electric blue on odd indexes for rhythm.
  const accent = index % 2 === 1 ? "text-electric" : "text-iris-glow";
  return (
    <div
      className={`flex flex-col py-7 ${
        divider ? "lg:border-r lg:border-white/[0.08]" : ""
      } [&:not(:first-child)]:lg:pl-9`}
    >
      <div className="num font-display text-[34px] font-extrabold leading-none tracking-[-1px] text-white sm:text-[40px] lg:text-[44px]">
        {stat.num}
        <span className={accent}>{stat.suffix}</span>
      </div>
      <div className="mt-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-50">
        {stat.label}
      </div>
    </div>
  );
}

function HeroWorkspace() {
  const [now, setNow] = useState<string>("");
  const [activeJob, setActiveJob] = useState(0);

  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      const ss = d.getSeconds().toString().padStart(2, "0");
      setNow(`${hh}:${mm}:${ss}`);
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveJob((i) => (i + 1) % 3);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const jobs = dashboardJobs.slice(0, 3);

  return (
    <div className="relative rounded-[22px] border border-white/[0.08] bg-noir-1/95 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8),0_0_0_1px_rgba(127,189,255,0.08)] backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="relative inline-flex h-2 w-2 items-center justify-center text-success live-ring">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="font-display text-[13px] font-semibold text-white">
            BODA · Studio OS
          </span>
        </div>
        <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-50 sm:inline">
          Production Pipeline
        </span>
        <span className="ml-auto num font-mono text-[11px] tracking-wide text-ink-30">
          {now || "00:00:00"} KST
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-6 py-3.5">
        <Pill tone="iris">진행 {heroQueue.rendering}</Pill>
        <Pill tone="electric">검수 {heroQueue.review}</Pill>
        <Pill tone="warning">내보내는 중 {heroQueue.exporting}</Pill>
        <Pill tone="success">오늘 완료 {heroQueue.doneToday}</Pill>
      </div>

      <div className="space-y-3 p-5 sm:p-6">
        {jobs.map((job, i) => (
          <HeroJobRow key={job.id} job={job} active={i === activeJob} />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3.5">
        <div className="flex items-center gap-2">
          <i className="ti ti-bolt text-[13px] text-electric" aria-hidden />
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-30">
            AVG · 24h delivery
          </span>
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-electric-soft">
          live sync
        </span>
      </div>
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "iris" | "electric" | "warning" | "success";
}) {
  const map: Record<typeof tone, string> = {
    iris: "bg-iris/15 text-iris-glow ring-1 ring-inset ring-iris/30",
    electric:
      "bg-electric/12 text-electric-soft ring-1 ring-inset ring-electric/30",
    warning: "bg-warning/12 text-warning ring-1 ring-inset ring-warning/30",
    success: "bg-success/12 text-success ring-1 ring-inset ring-success/30",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function HeroJobRow({
  job,
  active,
}: {
  job: DashboardJob;
  active: boolean;
}) {
  const stateMap: Record<DashboardJob["state"], {
    bar: string;
    icon: string;
    badge: string;
    label: string;
  }> = {
    rendering: {
      bar: "bg-electric",
      icon: "bg-iris/15 text-iris-glow ring-1 ring-inset ring-iris/30",
      badge:
        "bg-electric/12 text-electric-soft ring-1 ring-inset ring-electric/30",
      label: "RENDERING",
    },
    review: {
      bar: "bg-iris-glow",
      icon: "bg-iris/12 text-iris-glow ring-1 ring-inset ring-iris/25",
      badge: "bg-iris/12 text-iris-glow ring-1 ring-inset ring-iris/30",
      label: "REVIEW",
    },
    export: {
      bar: "bg-warning",
      icon: "bg-warning/12 text-warning ring-1 ring-inset ring-warning/30",
      badge: "bg-warning/12 text-warning ring-1 ring-inset ring-warning/30",
      label: "EXPORT",
    },
    done: {
      bar: "bg-success",
      icon: "bg-success/12 text-success ring-1 ring-inset ring-success/30",
      badge: "bg-success/12 text-success ring-1 ring-inset ring-success/30",
      label: "DELIVERED",
    },
  };

  const m = stateMap[job.state];

  return (
    <div
      className={`relative flex items-start gap-3 rounded-[14px] border bg-noir-2/80 px-4 py-3.5 transition-all duration-300 sm:px-5 ${
        active
          ? "border-electric/35 shadow-[0_0_0_1px_rgba(77,163,255,0.2),0_16px_40px_-22px_rgba(77,163,255,0.5)]"
          : "border-white/[0.06]"
      }`}
    >
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-[11px] ${m.icon}`}
      >
        <i className={`ti ${job.icon} text-[16px]`} aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-display text-[13px] font-semibold tracking-[-0.2px] text-white">
            {job.title}
          </p>
          <span className="num font-mono text-[10px] text-ink-50">
            {job.id}
          </span>
        </div>
        <p className="mt-1 truncate text-[11.5px] text-ink-50">
          {job.client} · {job.sub}
        </p>

        {job.state === "rendering" ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={`h-full rounded-full ${m.bar} transition-[width] duration-700`}
                style={{ width: `${job.progress}%` }}
              />
            </div>
            <span className="num font-mono text-[10px] font-semibold text-electric-soft">
              {job.progress}%
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] ${m.badge}`}
        >
          {m.label}
        </span>
        <span className="font-mono text-[10px] text-ink-50">{job.eta}</span>
      </div>
    </div>
  );
}
