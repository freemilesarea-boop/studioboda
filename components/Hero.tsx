"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowGlyph, LinkButton } from "./ui/Button";
import { heroStats, dashboardJobs } from "@/lib/site-data";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-ink-100 px-5 pb-0 pt-20 sm:px-8 sm:pt-24 lg:px-12 lg:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[680px] bg-ink-soft" />

      <div className="relative grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6 lg:pt-4">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-1.5 rounded-full border border-iris/45 bg-iris/20 px-3.5 py-1.5"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky animate-soft-pulse" />
            <span className="text-[12px] font-semibold text-sky">
              AI 기반 콘텐츠 제작 플랫폼
            </span>
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-[620px] font-display text-[40px] font-extrabold leading-[1.12] tracking-[-1.2px] text-white sm:text-[48px] lg:text-[56px] xl:text-[60px]"
          >
            콘텐츠 제작,
            <br />
            <span className="text-iris">AI</span>와{" "}
            <span className="text-sky">전문가</span>가
            <br />
            함께 완성합니다
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-[500px] text-[15px] leading-[1.75] text-ink-30 sm:text-[16px]"
          >
            상세페이지, 광고 배너, SNS 콘텐츠, 유튜브 썸네일, 브랜드 디자인까지.
            정보만 입력하면 AI가 초안을 잡고 디렉터가 완성합니다.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <LinkButton href="#quote" size="lg">
              무료 견적 받기 <ArrowGlyph />
            </LinkButton>
            <LinkButton href="#portfolio" size="lg" variant="ghost-light">
              포트폴리오 보기
            </LinkButton>
          </motion.div>
        </div>

        <div className="lg:col-span-6">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
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
      <div className="font-display text-[28px] font-extrabold leading-none tracking-[-0.5px] text-white sm:text-[30px]">
        {stat.num}
        <span className="text-iris">{stat.suffix}</span>
      </div>
      <div className="mt-2 text-[12px] text-ink-50">{stat.label}</div>
    </div>
  );
}

function HeroDashboard() {
  const jobs = dashboardJobs.slice(0, 3);
  return (
    <div className="relative rounded-[20px] border border-ink-90 bg-ink-90/40 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-ink-90 px-5 py-3.5">
        <span className="text-[13px] font-semibold text-white">
          내 주문 현황
        </span>
        <span className="ml-auto rounded-full bg-iris/20 px-2.5 py-1 text-[11px] font-semibold text-sky">
          진행 중 2건
        </span>
        <span className="rounded-full bg-[rgba(74,222,128,0.14)] px-2.5 py-1 text-[11px] font-semibold text-success">
          완료 8건
        </span>
      </div>

      <div className="space-y-2 p-4 sm:p-5">
        {jobs.map((job) => (
          <HeroJobRow key={job.title} job={job} />
        ))}
        <div className="flex items-center justify-between rounded-xl border border-ink-90 bg-ink-100/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-iris animate-soft-pulse" />
            <span className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30">
              AVG · 24H DELIVERY
            </span>
          </div>
          <span className="text-[11px] text-sky">실시간 동기화</span>
        </div>
      </div>
    </div>
  );
}

function HeroJobRow({ job }: { job: (typeof dashboardJobs)[number] }) {
  const barColor =
    job.tone === "iris"
      ? "bg-iris"
      : job.tone === "sky"
      ? "bg-sky"
      : "bg-success";
  const dotBg =
    job.tone === "iris"
      ? "bg-iris/20 text-sky"
      : job.tone === "sky"
      ? "bg-sky/20 text-sky"
      : "bg-[rgba(74,222,128,0.14)] text-success";

  return (
    <div className="flex items-center gap-3 rounded-[11px] bg-ink-90 px-3 py-3 sm:px-4">
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] ${dotBg}`}
      >
        <i className={`ti ${job.icon} text-[15px]`} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-white">
          {job.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-ink-50">{job.sub}</p>
      </div>
      <div className="ml-auto hidden text-right sm:block">
        <div className="mb-1 h-1 w-[90px] overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${job.progress}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-sky">
          {job.progress}% · {job.status}
        </span>
      </div>
      <div className="sm:hidden">
        <span className="rounded-full bg-ink-100 px-2 py-1 text-[10px] font-semibold text-sky">
          {job.status}
        </span>
      </div>
    </div>
  );
}
