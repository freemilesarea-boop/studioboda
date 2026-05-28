"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowGlyph, LinkButton } from "./ui/Button";
import { heroStats, dashboardJobs, heroQueue, type DashboardJob } from "@/lib/site-data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-ink-100 px-5 pb-0 pt-24 sm:px-8 sm:pt-28 lg:px-12 lg:pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[680px] bg-ink-soft" />

      <div className="relative grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6 lg:pt-4">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full border border-iris-glow/40 bg-iris/[0.18] px-3.5 py-1.5 shadow-[0_0_0_1px_rgba(140,124,255,0.06),0_8px_24px_-12px_rgba(91,71,255,0.55)] backdrop-blur-sm"
          >
            <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center text-iris-glow live-ring">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-iris-glow" />
            </span>
            <span className="text-[12px] font-semibold text-iris-glow">
              AI 기반 콘텐츠 제작 플랫폼
            </span>
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
            className="mt-7 max-w-[640px] font-display text-[40px] font-extrabold leading-[1.08] tracking-[-1.4px] text-white sm:text-[48px] lg:text-[56px] xl:text-[62px]"
          >
            콘텐츠 제작,
            <br />
            <span className="bg-iris-text bg-clip-text text-transparent [-webkit-background-clip:text]">
              AI
            </span>
            와{" "}
            <span className="text-sky">전문가</span>가
            <br />
            함께 완성합니다
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.14, ease: EASE }}
            className="mt-6 max-w-[520px] text-[15px] leading-[1.75] text-ink-30 sm:text-[16px]"
          >
            상세페이지, 광고 배너, SNS 콘텐츠, 유튜브 썸네일, 브랜드 디자인까지.
            정보만 입력하면 AI가 초안을 잡고 디렉터가 완성합니다.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <LinkButton href="#quote" size="lg">
              무료 견적 받기 <ArrowGlyph />
            </LinkButton>
            <LinkButton href="#portfolio" size="lg" variant="ghost-light">
              포트폴리오 보기
            </LinkButton>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={reduce ? undefined : { opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-30"
          >
            <span className="font-display font-bold uppercase tracking-eyebrow text-ink-50">
              TRUSTED BY
            </span>
            <span>D2C 브랜드</span>
            <span className="h-3 w-px bg-white/[0.08]" />
            <span>스마트스토어 셀러</span>
            <span className="h-3 w-px bg-white/[0.08]" />
            <span>스타트업</span>
            <span className="h-3 w-px bg-white/[0.08]" />
            <span>광고대행사</span>
          </motion.div>
        </div>

        <div className="lg:col-span-6">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          >
            <HeroDashboard />
          </motion.div>
        </div>
      </div>

      <div className="relative mt-16 grid grid-cols-2 border-t border-white/[0.08] sm:mt-20 lg:mt-16 lg:grid-cols-4">
        {heroStats.map((s, i) => (
          <HeroStat key={s.label} stat={s} divider={i < heroStats.length - 1} />
        ))}
      </div>
    </section>
  );
}

function HeroStat({
  stat,
  divider,
}: {
  stat: (typeof heroStats)[number];
  divider: boolean;
}) {
  return (
    <div
      className={`flex flex-col py-7 ${
        divider ? "lg:border-r lg:border-white/[0.08]" : ""
      } [&:not(:first-child)]:lg:pl-9`}
    >
      <div className="num font-display text-[28px] font-extrabold leading-none tracking-[-0.6px] text-white sm:text-[32px]">
        {stat.num}
        <span className="text-iris-glow">{stat.suffix}</span>
      </div>
      <div className="mt-2 text-[12px] text-ink-50">{stat.label}</div>
    </div>
  );
}

function HeroDashboard() {
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
    <div className="relative rounded-[20px] border border-ink-90 bg-ink-100/90 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-90 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative inline-flex h-2 w-2 items-center justify-center text-success live-ring">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="font-display text-[13px] font-semibold text-white">
            BODA · Studio OS
          </span>
        </div>
        <span className="hidden text-[11px] text-ink-50 sm:inline">
          내 주문 현황
        </span>
        <span className="ml-auto num font-mono text-[11px] tracking-wide text-ink-30">
          {now || "00:00:00"} KST
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-ink-90 px-5 py-3">
        <Pill tone="iris">진행 {heroQueue.rendering}</Pill>
        <Pill tone="sky">검수 {heroQueue.review}</Pill>
        <Pill tone="warning">내보내는 중 {heroQueue.exporting}</Pill>
        <Pill tone="success">오늘 완료 {heroQueue.doneToday}</Pill>
      </div>

      <div className="space-y-2 p-4 sm:p-5">
        {jobs.map((job, i) => (
          <HeroJobRow key={job.id} job={job} active={i === activeJob} />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-ink-90 px-5 py-3">
        <div className="flex items-center gap-2">
          <i className="ti ti-bolt text-[13px] text-iris-glow" aria-hidden />
          <span className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30">
            AVG · 24H DELIVERY
          </span>
        </div>
        <span className="text-[11px] text-sky">실시간 동기화</span>
      </div>
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "iris" | "sky" | "warning" | "success";
}) {
  const map: Record<typeof tone, string> = {
    iris: "bg-iris/22 text-iris-glow",
    sky: "bg-sky/20 text-sky",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${map[tone]}`}
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
      bar: "bg-iris-glow",
      icon: "bg-iris/22 text-iris-glow",
      badge: "bg-iris/20 text-iris-glow",
      label: "RENDERING",
    },
    review: {
      bar: "bg-sky",
      icon: "bg-sky/20 text-sky",
      badge: "bg-sky/15 text-sky",
      label: "REVIEW",
    },
    export: {
      bar: "bg-warning",
      icon: "bg-warning/15 text-warning",
      badge: "bg-warning/15 text-warning",
      label: "EXPORT",
    },
    done: {
      bar: "bg-success",
      icon: "bg-success/15 text-success",
      badge: "bg-success/15 text-success",
      label: "DELIVERED",
    },
  };

  const m = stateMap[job.state];

  return (
    <div
      className={`flex items-start gap-3 rounded-[12px] border bg-ink-90 px-3 py-3 transition-colors duration-200 sm:px-4 ${
        active
          ? "border-iris-glow/45 bg-iris/[0.10]"
          : "border-ink-90"
      }`}
    >
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${m.icon}`}
      >
        <i className={`ti ${job.icon} text-[16px]`} aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-display text-[12px] font-semibold text-white">
            {job.title}
          </p>
          <span className="num font-mono text-[10px] text-ink-50">
            {job.id}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-ink-50">
          {job.client} · {job.sub}
        </p>

        {job.state === "rendering" ? (
          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={`h-full rounded-full ${m.bar} transition-[width] duration-700`}
                style={{ width: `${job.progress}%` }}
              />
            </div>
            <span className="num text-[10px] font-semibold text-iris-glow">
              {job.progress}%
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.08em] ${m.badge}`}
        >
          {m.label}
        </span>
        <span className="text-[10px] text-ink-50">{job.eta}</span>
      </div>
    </div>
  );
}
