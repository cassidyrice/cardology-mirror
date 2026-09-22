"use client";

import { motion } from "framer-motion";
import type { BondObservation } from "./compare";

const ACCENT: Record<BondObservation["kind"], string> = {
  shared: "!text-brand-club",
  complement: "!text-brand-bronze",
  tension: "!text-brand-bronze",
  "gift-shadow": "!text-brand-club",
};

const DOT: Record<BondObservation["kind"], string> = {
  shared: "bg-brand-club",
  complement: "bg-brand-gold-soft",
  tension: "bg-brand-bronze",
  "gift-shadow": "bg-brand-oxblood",
};

export function ObservationCard({
  obs,
  index,
}: {
  obs: BondObservation;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="card-surface p-5"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[obs.kind]}`} />
        <span className={`eyebrow ${ACCENT[obs.kind]}`}>{obs.label}</span>
      </div>
      <p className="prose-reading text-[1rem] leading-relaxed text-brand-ink-soft">
        {obs.text}
      </p>
    </motion.div>
  );
}
