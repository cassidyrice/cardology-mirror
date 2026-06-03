"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface IntroSlideProps {
  index: number;
  total: number;
  eyebrow: string;
  line: string;
  sub?: ReactNode;
}

/**
 * A single stark, editorial intro panel — Co-Star style: big serif line,
 * an uppercase eyebrow, and lots of breathing room.
 */
export function IntroSlide({ index, total, eyebrow, line, sub }: IntroSlideProps) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col justify-center"
    >
      <p className="eyebrow mb-8">
        {eyebrow} · {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      <h1 className="display max-w-sm text-balance text-4xl leading-[1.08] text-bone sm:text-5xl">
        {line}
      </h1>
      {sub && <p className="mt-7 max-w-sm text-[0.98rem] leading-relaxed text-mist">{sub}</p>}
    </motion.div>
  );
}
