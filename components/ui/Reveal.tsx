"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type AsTag =
  | "div"
  | "section"
  | "li"
  | "span"
  | "header"
  | "footer"
  | "article"
  | "ul";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: AsTag;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Reveal({
  children,
  delay = 0,
  y = 12,
  className = "",
  as = "div",
}: Props) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: AsTag;
};

export function Stagger({
  children,
  className = "",
  delay = 0,
  stagger = 0.06,
  as = "div",
}: StaggerProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      initial="hidden"
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

type ItemProps = {
  children: ReactNode;
  className?: string;
  y?: number;
  as?: AsTag;
};

export function StaggerItem({
  children,
  className = "",
  y = 12,
  as = "div",
}: ItemProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      variants={{
        hidden: reduce ? {} : { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: EASE },
        },
      }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
