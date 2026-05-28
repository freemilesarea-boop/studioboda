"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowIcon, LinkButton } from "./ui/Button";
import { brand, heroDashboard } from "@/lib/site-data";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36">
      <div className="absolute inset-x-0 top-0 -z-10 h-[680px] bg-soft-grad" />
      <div className="absolute inset-x-0 top-[420px] -z-10 h-[1px] bg-ink-15" />
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="meta inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-iris animate-pulse-soft" />
                {brand.values.join(" · ")}
              </div>
            </motion.div>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-balance font-sans text-[44px] font-semibold leading-[1.04] tracking-tightest text-ink-100 sm:text-[60px] lg:text-[72px]"
            >
              See it. Make it.
              <br />
              <span className="gradient-text">Ship it tomorrow.</span>
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl text-balance text-lg leading-[1.6] text-ink-70 sm:text-xl"
            >
              <span className="text-ink-100">당신의 브랜드를 한 번 더 보다.</span>{" "}
              AI로 상세페이지, 광고, 콘텐츠를 24시간 안에 완성하는 프리미엄 크리에이티브 스튜디오.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <LinkButton href="#contact" size="lg">
                프로젝트 문의하기 <ArrowIcon />
              </LinkButton>
              <LinkButton href="#portfolio" size="lg" variant="secondary">
                포트폴리오 보기
              </LinkButton>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={reduce ? undefined : { opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.32 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-ink-50"
            >
              <span className="meta">TRUSTED BY</span>
              <span className="text-ink-70">스마트스토어 셀러</span>
              <span className="h-3 w-px bg-ink-15" />
              <span className="text-ink-70">D2C 브랜드</span>
              <span className="h-3 w-px bg-ink-15" />
              <span className="text-ink-70">스타트업</span>
              <span className="h-3 w-px bg-ink-15" />
              <span className="text-ink-70">광고대행사</span>
            </motion.div>
          </div>

          <div className="lg:col-span-6">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <DashboardCard />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 -z-10 rounded-[2.25rem] bg-iris-grad opacity-[0.10] blur-xl" />
      <div className="rounded-3xl border border-ink-15 bg-white/95 p-5 shadow-soft backdrop-blur sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-iris" />
            <span className="meta text-ink-70">BODA · STUDIO OS</span>
          </div>
          <div className="meta">LIVE</div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatTile label="생성 중" value={heroDashboard.inProgress} suffix="건" tone="iris" />
          <StatTile label="완료" value={heroDashboard.completed} suffix="건" tone="ink" />
        </div>

        <div className="mt-5 space-y-3">
          {heroDashboard.jobs.map((job) => (
            <JobRow key={job.title} job={job} />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink-05 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-iris animate-pulse-soft" />
            <span className="meta text-ink-70">AVG · 24H DELIVERY</span>
          </div>
          <span className="font-mono text-xs text-ink-90">+38% CTR</span>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number;
  suffix: string;
  tone: "iris" | "ink";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "iris"
          ? "border-iris/20 bg-iris/5"
          : "border-ink-15 bg-white"
      }`}
    >
      <div className="meta">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={`font-sans text-3xl font-semibold tracking-tightest ${
            tone === "iris" ? "text-iris" : "text-ink-100"
          }`}
        >
          {value}
        </span>
        <span className="text-sm text-ink-50">{suffix}</span>
      </div>
    </div>
  );
}

function JobRow({
  job,
}: {
  job: (typeof heroDashboard.jobs)[number];
}) {
  const done = job.progress >= 100;
  const barColor =
    job.tone === "iris"
      ? "bg-iris"
      : job.tone === "sky"
      ? "bg-sky-drift"
      : "bg-plum-halo";

  return (
    <div className="rounded-2xl border border-ink-15 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="meta text-ink-50">{job.meta}</div>
          <div className="mt-1 truncate text-sm font-medium text-ink-100">
            {job.title}
          </div>
        </div>
        <div className="ml-3 shrink-0">
          {done ? (
            <span className="meta inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-white">
              DONE
            </span>
          ) : (
            <span className="meta inline-flex items-center gap-1 rounded-full bg-ink-05 px-2.5 py-1 text-ink-70">
              {job.status}
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-15">
          <div
            className={`h-full rounded-full ${barColor} transition-all`}
            style={{ width: `${job.progress}%` }}
          />
        </div>
        <span className="w-12 text-right font-mono text-xs text-ink-70">
          {job.progress}%
        </span>
      </div>
    </div>
  );
}
