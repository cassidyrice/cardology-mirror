"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Eyebrow, SectionTitle } from "@/components/ui";

// A staggered, fade-up reveal wrapper for each blueprint section.
export function Section({
  eyebrow,
  title,
  index = 0,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: ReactNode;
  index?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
      {title && <SectionTitle className="mb-4">{title}</SectionTitle>}
      {children}
    </motion.section>
  );
}
